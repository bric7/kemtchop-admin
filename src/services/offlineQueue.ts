// src/services/offlineQueue.ts - Version Web compatible (Vercel)

const QUEUE_KEY = 'kemtchop_offline_queue';
const MAX_RETRIES = 3;

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: QueuedRequest[] = [];
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private apiBase: string;

  // ✅ SOLUTION FIABLE : cast import.meta en any
  private constructor(apiBase: string = 
    ((import.meta as any).env?.VITE_API_URL) || 'http://localhost:8000'
  ) {
    this.apiBase = apiBase.replace(/\/$/, '');
    this.loadQueue();
    this.startAutoSync();
    
    window.addEventListener('online', () => {
      console.log('📡 Back online, syncing...');
      this.sync();
    });
    window.addEventListener('offline', () => {
      console.log('📴 Going offline, queuing requests');
    });
  }

  static getInstance(apiBase?: string): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue(apiBase);
    }
    return OfflineQueue.instance;
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 Queue chargée: ${this.queue.length} requêtes en attente`);
      }
    } catch (e) {
      console.error('❌ Erreur chargement queue:', e);
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('❌ Erreur sauvegarde queue:', e);
    }
  }

  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queued: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      priority: request.priority || 'normal',
    };

    if (queued.priority === 'high') {
      this.queue.unshift(queued);
    } else {
      this.queue.push(queued);
    }

    this.saveQueue();
    console.log(`✅ Requête en queue: ${queued.endpoint} (ID: ${queued.id})`);

    if (navigator.onLine) {
      this.sync();
    }

    return queued.id;
  }

  async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('⏳ Sync déjà en cours');
      return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('📴 Offline: sync reportée');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    const results = { success: 0, failed: 0 };

    const sorted = [...this.queue].sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    for (const request of sorted) {
      try {
        const url = request.endpoint.startsWith('http') 
          ? request.endpoint 
          : `${this.apiBase}/${request.endpoint.replace(/^\//, '')}`;

        const response = await fetch(url, {
          method: request.method,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}`
          },
          body: JSON.stringify(request.payload),
        });

        if (response.ok) {
          this.queue = this.queue.filter((q) => q.id !== request.id);
          results.success++;
          console.log(`✅ Sync réussi: ${request.endpoint}`);
        } else {
          if (response.status >= 500 && request.retryCount < MAX_RETRIES) {
            request.retryCount++;
            console.log(`⚠️ Erreur serveur, retry ${request.retryCount}/${MAX_RETRIES}: ${request.endpoint}`);
          } else {
            this.queue = this.queue.filter((q) => q.id !== request.id);
            results.failed++;
            console.log(`❌ Échec définitif: ${request.endpoint} (status: ${response.status})`);
          }
        }
      } catch (error) {
        if (request.retryCount < MAX_RETRIES) {
          request.retryCount++;
          console.log(`⚠️ Erreur réseau, retry ${request.retryCount}/${MAX_RETRIES}: ${request.endpoint}`);
        } else {
          this.queue = this.queue.filter((q) => q.id !== request.id);
          results.failed++;
          console.log(`❌ Échec après ${MAX_RETRIES} retries: ${request.endpoint}`);
        }
      }
    }

    this.saveQueue();
    this.isSyncing = false;
    
    console.log(`🔄 Sync terminée: ${results.success} succès, ${results.failed} échecs`);
    return results;
  }

  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      this.sync();
    }, 30000);
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
    this.saveQueue();
    console.log('🗑️ Queue vidée');
  }
}