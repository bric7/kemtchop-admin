import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const SERVER_IP = "127.0.0.1"; 

  const fetchOrders = async () => {
    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.log("Erreur de récupération des commandes Kemtchop:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000); // Rafraîchissement auto
    return () => clearInterval(interval);
  }, []);

  const renderOrder = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.statusBadge}>{item.status}</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.info}><Text style={styles.bold}>Plat:</Text> {item.product_name}</Text>
      <Text style={styles.info}><Text style={styles.bold}>Quartier:</Text> {item.zone}</Text>
      <Text style={styles.info}><Text style={styles.bold}>Accompagnement:</Text> {item.complement}</Text>
      
      <View style={styles.priceRow}>
        <Text style={styles.totalPrice}>Total: {item.total_price} FCFA</Text>
        <Text style={styles.deposit}>Acompte: {item.deposit_amount} FCFA</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.btnCall} 
          onPress={() => Linking.openURL(`tel:${item.phone}`)}
        >
          <Text style={styles.btnText}>Appeler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnDone}>
          <Text style={styles.btnTextWhite}>Livré</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderOrder}
        ListHeaderComponent={<Text style={styles.mainTitle}>Gestion des Commandes</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4', padding: 10 },
  mainTitle: { fontSize: 24, fontWeight: '900', color: '#333', marginVertical: 20, textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 18, fontWeight: 'bold', color: '#E31C25' },
  statusBadge: { backgroundColor: '#EEE', padding: 5, borderRadius: 5, fontSize: 10, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  info: { fontSize: 14, color: '#444', marginBottom: 3 },
  bold: { fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalPrice: { fontWeight: 'bold', color: '#333' },
  deposit: { fontWeight: 'bold', color: '#28A745' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btnCall: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  btnDone: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#333', alignItems: 'center' },
  btnText: { fontWeight: 'bold', color: '#333' },
  btnTextWhite: { fontWeight: 'bold', color: '#FFF' },
});

export default AdminOrders;