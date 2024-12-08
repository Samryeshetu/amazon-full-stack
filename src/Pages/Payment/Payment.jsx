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

function Payment() {
  const [{ user, basket }, dispatch] = useContext(DataContext);
  console.log("User:", user);

  const totalItem = basket?.reduce((amount, item) => {
    return item.amount + amount;
  }, 0);

  const total =
    basket?.reduce((amount, item) => {
      return item.price * item.amount + amount;
    }, 0) || 0; // Ensure total is at least 0

  const [cardError, setCardError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const handleChange = (e) => {
    console.log("Card Element Change Event:", e);
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

    console.log("Total Amount (in cents):", total * 100);

    // Get clientSecret from the backend
    const response = await axiosInstance.post("/payment/create", {
      total: total * 100,
    });

    const clientSecret = response.data?.clientSecret;
    console.log("Received clientSecret:", clientSecret);

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
      console.error("Error during payment confirmation:", error);
      throw new Error(error.message);
    }

    console.log("Payment Intent Confirmed:", paymentIntent);

    dispatch({ type: "EMPTY_BASKET" });
    navigate("/orders");
  } catch (err) {
    console.error("Payment Error:", err.message);
    setCardError(err.message || "Payment failed.");
  } finally {
    setProcessing(false);
  }
};


  return (
    <LayOut>
      {/* Header */}
      <div className={classes.payment__header}>
        Checkout ({totalItem}) items
      </div>

      {/* Payment Section */}
      <section className={classes.payment}>
        {/* Delivery Address */}
        <div className={classes.flex}>
          <h3>Delivery Address</h3>
          <div>
            <div>{user?.email}</div>
            <div>123 React Lane</div>
            <div>Chicago, IL</div>
          </div>
        </div>
        <hr />

        {/* Review Items */}
        <div className={classes.flex}>
          <h3>Review items and delivery</h3>
          <div>
            {basket?.map((item) => (
              <ProductCard key={item.id} product={item} flex={true} />
            ))}
          </div>
        </div>
        <hr />

        {/* Payment Form */}
        <div className={classes.flex}>
          <h3>Payment methods</h3>
          <div className={classes.payment__card__container}>
            <div className={classes.payment__details}>
              <form onSubmit={handlePayment}>
                {/* Error Message */}
                {cardError && (
                  <small style={{ color: "red" }}>{cardError}</small>
                )}

                {/* Card Input */}
                <CardElement onChange={handleChange} />

                {/* Payment Details */}
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
