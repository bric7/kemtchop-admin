// src/services/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { log } from '../utils/platform';

const QUEUE_KEY = '@kemtchop:offline_queue';
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
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private constructor() {
    this.loadQueue();
    this.startAutoSync();
    
    // Écouter les changements de connexion
    NetInfo.addEventListener((state) => {
      log('📡 Connexion:', state.isConnected ? 'ONLINE' : 'OFFLINE');
      if (state.isConnected) {
        this.sync();
      }
    });
  }

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  // ✅ Charger la queue depuis AsyncStorage
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        log(`📦 Queue chargée: ${this.queue.length} requêtes en attente`);
      }
    } catch (e) {
      log('❌ Erreur chargement queue:', e);
    }
  }

  // ✅ Sauvegarder la queue dans AsyncStorage
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      log('❌ Erreur sauvegarde queue:', e);
    }
  }

  // ✅ Ajouter une requête à la queue
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queued: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      priority: request.priority || 'normal',
    };

    // Insertion par priorité (high en premier)
    if (queued.priority === 'high') {
      this.queue.unshift(queued);
    } else {
      this.queue.push(queued);
    }

    await this.saveQueue();
    log(`✅ Requête en queue: ${queued.endpoint} (ID: ${queued.id})`);

    // Tenter une sync immédiate si online
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      this.sync();
    }

    return queued.id;
  }

  // ✅ Synchroniser la queue avec le backend
  async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      log('⏳ Sync déjà en cours');
      return { success: 0, failed: 0 };
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      log('📴 Offline: sync reportée');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    const results = { success: 0, failed: 0 };

    // Trier par priorité puis par ancienneté
    const sorted = [...this.queue].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    for (const request of sorted) {
      try {
        const response = await fetch(`http://${request.endpoint.startsWith('http') ? '' : '127.0.0.1:8000/'}${request.endpoint}`, {
          method: request.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.payload),
        });

        if (response.ok) {
          // Supprimer de la queue si succès
          this.queue = this.queue.filter((q) => q.id !== request.id);
          results.success++;
          log(`✅ Sync réussi: ${request.endpoint}`);
        } else {
          // Gérer les erreurs 4xx (ne pas retry) vs 5xx (retry)
          if (response.status >= 500 && request.retryCount < MAX_RETRIES) {
            request.retryCount++;
            log(`⚠️ Erreur serveur, retry ${request.retryCount}/${MAX_RETRIES}: ${request.endpoint}`);
          } else {
            this.queue = this.queue.filter((q) => q.id !== request.id);
            results.failed++;
            log(`❌ Échec définitif: ${request.endpoint} (status: ${response.status})`);
          }
        }
      } catch (error) {
        // Erreur réseau: incrémenter retryCount si possible
        if (request.retryCount < MAX_RETRIES) {
          request.retryCount++;
          log(`⚠️ Erreur réseau, retry ${request.retryCount}/${MAX_RETRIES}: ${request.endpoint}`);
        } else {
          this.queue = this.queue.filter((q) => q.id !== request.id);
          results.failed++;
          log(`❌ Échec après ${MAX_RETRIES} retries: ${request.endpoint}`);
        }
      }
    }

    await this.saveQueue();
    this.isSyncing = false;
    
    log(`🔄 Sync terminée: ${results.success} succès, ${results.failed} échecs`);
    return results;
  }

  // ✅ Démarrer la sync automatique toutes les 30 secondes
  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      this.sync();
    }, 30000);
  }

  // ✅ Nettoyer (à appeler au démontage de l'app si nécessaire)
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ✅ Getters pour l'UI
  getQueueLength(): number {
    return this.queue.length;
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  // ✅ Vider la queue (pour debug ou reset)
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    log('🗑️ Queue vidée');
  }
}