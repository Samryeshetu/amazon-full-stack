import React, { useContext, useState, useEffect } from "react";
import LayOut from "../../Components/LayOut/LayOut";
import classes from "./Orders.module.css";
import { db } from "../../Utility/firebase";
import { DataContext } from "../../Components/DataProvider/DataProvider";
import ProductCard from "../../Components/Product/ProductCard";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; // Firestore methods

function Orders() {
  const [{ user }, dispatch] = useContext(DataContext); // Get the logged-in user context
  const [orders, setOrders] = useState([]); // State for storing orders

  useEffect(() => {
    // Ensure the user exists before fetching orders
    if (user) {
      console.log("User logged in:", user); // Debugging: log the user object

      // Reference to the user's orders sub-collection
      const ordersRef = collection(db, "users", user.uid, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc")); // Query to order by 'createdAt'

      // Subscribe to Firestore updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedOrders = snapshot.docs.map((doc) => ({
            id: doc.id, // Order ID
            data: doc.data(), // Order data
          }));
          console.log("Fetched orders:", fetchedOrders); // Debugging: log fetched orders
          setOrders(fetchedOrders);
        },
        (error) => {
          console.error("Error fetching orders:", error); // Debugging: log errors
        }
      );

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } else {
      setOrders([]); // Reset orders if no user is logged in
    }
  }, [user]); // Re-run effect when user changes

  return (
    <LayOut>
      <section className={classes.container}>
        <div className={classes.orders__container}>
          <h2>Your Orders</h2>

          {/* Display message if there are no orders */}
          {orders?.length === 0 && (
            <div style={{ padding: "20px" }}>
              You don't have any orders yet.
            </div>
          )}

          {/* Render ordered items */}
          <div>
            {orders?.map((eachOrder) => (
              <div key={eachOrder.id} className={classes.order}>
                {/* Display Order ID only once at the top */}
                <p className={classes.order__id}>Order ID: {eachOrder.id}</p>

                {/* Render all items in the basket */}
                {eachOrder?.data?.basket?.length > 0 ? (
                  eachOrder.data.basket.map((order) => (
                    <ProductCard flex={true} product={order} key={order.id} />
                  ))
                ) : (
                  <p>No items in this order.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </LayOut>
  );
}

export default Orders;