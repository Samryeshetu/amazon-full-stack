import React, { useContext, useState } from "react";
import classes from "./Payment.module.css";
import LayOut from "../../Components/LayOut/LayOut";
import { DataContext } from "../../Components/DataProvider/DataProvider";
import ProductCard from "../../Components/Product/ProductCard";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import CurrencyFormat from "../../Components/CurrencyFormat/CurrencyFormat";
import { axiosInstance } from "../../Api/axios";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { db } from "../../Utility/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function Payment() {
  const [{ user, basket }, dispatch] = useContext(DataContext);
  const [cardError, setCardError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const totalItem = basket?.reduce((amount, item) => item.amount + amount, 0);

  const total =
    basket?.reduce((amount, item) => item.price * item.amount + amount, 0) || 0;

  const handleChange = (e) => {
    e?.error?.message ? setCardError(e?.error?.message) : setCardError("");
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    try {
      setProcessing(true);
      setCardError(null);

      if (!stripe || !elements) {
        throw new Error("Stripe not initialized.");
      }

      // Get clientSecret from the backend
      const response = await axiosInstance.post("/payment/create", {
        total: total * 100, // Total in cents
      });

      const clientSecret = response.data?.clientSecret;

      if (!clientSecret) {
        throw new Error("Failed to get clientSecret.");
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Save order to Firebase
      await saveOrderToFirebase(paymentIntent);

      // Clear the basket and redirect to orders page
      dispatch({ type: "EMPTY_BASKET" });
      navigate("/orders");
    } catch (err) {
      setCardError(err.message || "Payment failed.");
    } finally {
      setProcessing(false);
    }
  };

  const saveOrderToFirebase = async (paymentIntent) => {
    if (!user) return;

    const orderData = {
      user: {
        email: user.email,
        uid: user.uid,
      },
      basket: basket.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        amount: item.amount,
      })),
      total,
      paymentIntentId: paymentIntent.id,
      createdAt: serverTimestamp(),
    };

    try {
      // Save order to Firestore
      await setDoc(doc(db, "orders", paymentIntent.id), orderData);
      console.log("Order successfully saved to Firebase.");
    } catch (err) {
      console.error("Error saving order to Firebase:", err);
    }
  };

  return (
    <LayOut>
      <div className={classes.payment__header}>
        Checkout ({totalItem}) items
      </div>

      <section className={classes.payment}>
        <div className={classes.flex}>
          <h3>Delivery Address</h3>
          <div>
            <div>{user?.email}</div>
            <div>123 React Lane</div>
            <div>Chicago, IL</div>
          </div>
        </div>
        <hr />

        <div className={classes.flex}>
          <h3>Review items and delivery</h3>
          <div>
            {basket?.map((item) => (
              <ProductCard key={item.id} product={item} flex={true} />
            ))}
          </div>
        </div>
        <hr />

        <div className={classes.flex}>
          <h3>Payment methods</h3>
          <div className={classes.payment__card__container}>
            <div className={classes.payment__details}>
              <form onSubmit={handlePayment}>
                {cardError && (
                  <small style={{ color: "red" }}>{cardError}</small>
                )}
                <CardElement onChange={handleChange} />
                <div className={classes.payment__price}>
                  <div>
                    <span style={{ display: "flex", gap: "10px" }}>
                      <p>Total Order |</p> <CurrencyFormat amount={total} />
                    </span>
                  </div>
                  <button type="submit" disabled={processing || !stripe}>
                    {processing ? (
                      <div className={classes.loading}>
                        <ClipLoader color="gray" size={12} />
                        <p>Please Wait ...</p>
                      </div>
                    ) : (
                      "Pay Now"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </LayOut>
  );
}

export default Payment;