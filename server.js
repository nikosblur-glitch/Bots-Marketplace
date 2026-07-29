```javascript
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// SETTINGS
// ==========================================

const ORDERS_FILE = path.join(__dirname, "orders.json");

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());

app.use(express.static(__dirname));

// ==========================================
// CREATE ORDERS FILE IF IT DOES NOT EXIST
// ==========================================

if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(
        ORDERS_FILE,
        JSON.stringify([], null, 2)
    );
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function readOrders() {

    try {

        const data =
            fs.readFileSync(
                ORDERS_FILE,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Error reading orders:",
            error
        );

        return [];

    }

}


function saveOrders(orders) {

    fs.writeFileSync(
        ORDERS_FILE,
        JSON.stringify(
            orders,
            null,
            2
        )
    );

}


function generateOrderId() {

    return (
        "DBM-" +
        Date.now() +
        "-" +
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase()
    );

}


// ==========================================
// CALCULATE CART TOTAL
// IMPORTANT:
// NEVER TRUST THE TOTAL SENT BY THE CLIENT
// ==========================================

function calculateTotal(cart) {

    let total = 0;

    for (const product of cart) {

        const price =
            Number(product.price) || 0;

        const quantity =
            Number(product.quantity) || 1;

        if (
            price < 0 ||
            quantity < 1
        ) {
            continue;
        }

        total +=
            price * quantity;

    }

    return Number(
        total.toFixed(2)
    );

}


// ==========================================
// CREATE CHECKOUT
// ==========================================

app.post(
    "/api/create-checkout",
    async (req, res) => {

        try {

            const {
                paymentMethod,
                cart
            } = req.body;


            // ------------------------------
            // VALIDATION
            // ------------------------------

            if (
                !paymentMethod ||
                !["paypal", "revolut"]
                    .includes(paymentMethod)
            ) {

                return res.status(400).json({

                    error:
                        "Invalid payment method."

                });

            }


            if (
                !Array.isArray(cart) ||
                cart.length === 0
            ) {

                return res.status(400).json({

                    error:
                        "Cart is empty."

                });

            }


            // ------------------------------
            // CALCULATE TOTAL
            // ------------------------------

            const total =
                calculateTotal(cart);


            if (total <= 0) {

                return res.status(400).json({

                    error:
                        "Invalid order total."

                });

            }


            // ------------------------------
            // CREATE ORDER
            // ------------------------------

            const order = {

                id:
                    generateOrderId(),

                items:
                    cart.map(product => ({

                        name:
                            String(
                                product.name ||
                                "Product"
                            ),

                        quantity:
                            Number(
                                product.quantity
                            ) || 1,

                        price:
                            Number(
                                product.price
                            ) || 0

                    })),

                total:
                    total,

                currency:
                    "EUR",

                paymentMethod:
                    paymentMethod,

                status:
                    "PENDING",

                createdAt:
                    new Date()
                        .toISOString()

            };


            // ------------------------------
            // SAVE ORDER
            // ------------------------------

            const orders =
                readOrders();

            orders.push(order);

            saveOrders(orders);


            // ------------------------------
            // PAYMENT PROVIDER
            // ------------------------------

            /*
                IMPORTANT:

                Εδώ θα συνδεθεί το επίσημο
                PayPal API ή Revolut API.

                Το API θα δημιουργήσει
                ένα πραγματικό checkout session
                και θα επιστρέψει το URL.

                Προς το παρόν επιστρέφουμε
                ένα demo response.
            */


            if (
                paymentMethod === "paypal"
            ) {

                return res.json({

                    success: true,

                    orderId:
                        order.id,

                    paymentMethod:
                        "paypal",

                    checkoutUrl:
                        "/payment-demo.html?order=" +
                        encodeURIComponent(
                            order.id
                        )

                });

            }


            if (
                paymentMethod === "revolut"
            ) {

                return res.json({

                    success: true,

                    orderId:
                        order.id,

                    paymentMethod:
                        "revolut",

                    checkoutUrl:
                        "/payment-demo.html?order=" +
                        encodeURIComponent(
                            order.id
                        )

                });

            }

        } catch (error) {

            console.error(
                "Checkout error:",
                error
            );

            res.status(500).json({

                error:
                    "Internal server error."

            });

        }

    }
);


// ==========================================
// GET ORDERS
// OWNER PANEL
// ==========================================

app.get(
    "/api/orders",
    (req, res) => {

        const orders =
            readOrders();

        res.json(orders);

    }
);


// ==========================================
// GET SINGLE ORDER
// ==========================================

app.get(
    "/api/orders/:id",
    (req, res) => {

        const orders =
            readOrders();

        const order =
            orders.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!order) {

            return res.status(404).json({

                error:
                    "Order not found."

            });

        }

        res.json(order);

    }
);


// ==========================================
// UPDATE ORDER STATUS
// OWNER PANEL
// ==========================================

app.patch(
    "/api/orders/:id",
    (req, res) => {

        const {
            status
        } = req.body;

        const allowedStatuses = [

            "PENDING",
            "PAID",
            "CANCELLED",
            "COMPLETED"

        ];

        if (
            !allowedStatuses
                .includes(status)
        ) {

            return res.status(400).json({

                error:
                    "Invalid status."

            });

        }


        const orders =
            readOrders();

        const order =
            orders.find(
                item =>
                    item.id ===
                    req.params.id
            );


        if (!order) {

            return res.status(404).json({

                error:
                    "Order not found."

            });

        }


        order.status =
            status;


        order.updatedAt =
            new Date()
                .toISOString();


        saveOrders(orders);


        res.json({

            success: true,

            order:
                order

        });

    }
);


// ==========================================
// SUCCESS PAGE
// ==========================================

app.get(
    "/payment/success",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "success.html"
            )
        );

    }
);


// ==========================================
// CANCEL PAGE
// ==========================================

app.get(
    "/payment/cancel",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "cancel.html"
            )
        );

    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "Discord Bot Marketplace"
        );

        console.log(
            "Server running on:"
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            "================================="
        );

    }
);
```
