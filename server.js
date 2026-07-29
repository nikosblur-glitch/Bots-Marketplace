```js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const ORDERS_FILE = path.join(__dirname, "orders.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// ==========================================
// READ ORDERS
// ==========================================

function getOrders() {

    try {

        if (!fs.existsSync(ORDERS_FILE)) {

            fs.writeFileSync(
                ORDERS_FILE,
                "[]",
                "utf8"
            );

        }

        return JSON.parse(
            fs.readFileSync(
                ORDERS_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "Error reading orders:",
            error
        );

        return [];

    }

}


// ==========================================
// SAVE ORDERS
// ==========================================

function saveOrders(orders) {

    fs.writeFileSync(

        ORDERS_FILE,

        JSON.stringify(
            orders,
            null,
            2
        ),

        "utf8"

    );

}


// ==========================================
// CREATE ORDER
// ==========================================

app.post(
    "/api/orders",
    (req, res) => {

        try {

            const {
                customer,
                email,
                items,
                paymentMethod
            } = req.body;


            if (
                !customer ||
                !email ||
                !items ||
                !Array.isArray(items) ||
                items.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                    "Invalid order data."

                });

            }


            const total = items.reduce(

                (sum, item) => {

                    return sum +
                    (
                        Number(item.price) *
                        Number(item.quantity)
                    );

                },

                0

            );


            const order = {

                id:
                "DBM-" +
                Date.now(),

                customer,

                email,

                items,

                total:
                Number(
                    total.toFixed(2)
                ),

                paymentMethod:
                paymentMethod ||
                "pending",

                paymentStatus:
                "pending",

                orderStatus:
                "new",

                createdAt:
                new Date().toISOString()

            };


            const orders =
            getOrders();


            orders.push(
                order
            );


            saveOrders(
                orders
            );


            console.log(
                "New order:",
                order.id
            );


            res.status(201).json({

                success: true,

                message:
                "Order created successfully.",

                order

            });


        } catch (error) {

            console.error(
                error
            );


            res.status(500).json({

                success: false,

                message:
                "Server error."

            });

        }

    }
);


// ==========================================
// GET ALL ORDERS
// OWNER PANEL USE ONLY
// ==========================================

app.get(
    "/api/orders",
    (req, res) => {

        try {

            const orders =
            getOrders();


            res.json({

                success: true,

                orders

            });


        } catch (error) {

            res.status(500).json({

                success: false,

                message:
                "Could not load orders."

            });

        }

    }
);


// ==========================================
// UPDATE ORDER STATUS
// ==========================================

app.patch(
    "/api/orders/:id",
    (req, res) => {

        try {

            const {
                orderStatus,
                paymentStatus
            } = req.body;


            const orders =
            getOrders();


            const order =
            orders.find(

                item =>
                item.id ===
                req.params.id

            );


            if (!order) {

                return res.status(404).json({

                    success: false,

                    message:
                    "Order not found."

                });

            }


            if (
                orderStatus
            ) {

                order.orderStatus =
                orderStatus;

            }


            if (
                paymentStatus
            ) {

                order.paymentStatus =
                paymentStatus;

            }


            saveOrders(
                orders
            );


            res.json({

                success: true,

                order

            });


        } catch (error) {

            res.status(500).json({

                success: false,

                message:
                "Could not update order."

            });

        }

    }
);


// ==========================================
// DELETE ORDER
// ==========================================

app.delete(
    "/api/orders/:id",
    (req, res) => {

        try {

            let orders =
            getOrders();


            const oldLength =
            orders.length;


            orders =
            orders.filter(

                order =>
                order.id !==
                req.params.id

            );


            if (
                orders.length ===
                oldLength
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                    "Order not found."

                });

            }


            saveOrders(
                orders
            );


            res.json({

                success: true,

                message:
                "Order deleted."

            });


        } catch (error) {

            res.status(500).json({

                success: false,

                message:
                "Could not delete order."

            });

        }

    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(

    PORT,

    () => {

        console.log(
            `Discord Board Marketplace running at http://localhost:${PORT}`
        );

    }

);
```
