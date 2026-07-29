const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ORDERS_FILE = path.join(__dirname, "orders.json");

function loadOrders() {
    if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, "[]");
    }

    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
}

function saveOrders(orders) {
    fs.writeFileSync(
        ORDERS_FILE,
        JSON.stringify(orders, null, 2)
    );
}

function createOrderId() {
    return "DBM-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

// Δημιουργία παραγγελίας
app.post("/api/orders", (req, res) => {

    try {

        const {
            customerName,
            customerEmail,
            items,
            total,
            paymentMethod
        } = req.body;

        if (!customerName ||
            !customerEmail ||
            !items ||
            !items.length ||
            !total ||
            !paymentMethod) {

            return res.status(400).json({
                success: false,
                message: "Missing order information."
            });
        }

        const orders = loadOrders();

        const order = {
            id: createOrderId(),
            customerName,
            customerEmail,
            items,
            total,
            paymentMethod,
            status: "pending",
            createdAt: new Date().toISOString()
        };

        orders.push(order);

        saveOrders(orders);

        res.json({
            success: true,
            orderId: order.id
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});

// Προβολή παραγγελίας
app.get("/api/orders/:id", (req, res) => {

    const orders = loadOrders();

    const order = orders.find(
        o => o.id === req.params.id
    );

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found."
        });
    }

    res.json({
        success: true,
        order
    });
});

// Owner Panel - όλες οι παραγγελίες
app.get("/api/orders", (req, res) => {

    const orders = loadOrders();

    res.json({
        success: true,
        orders
    });
});

// Αλλαγή status παραγγελίας
app.patch("/api/orders/:id", (req, res) => {

    const orders = loadOrders();

    const order = orders.find(
        o => o.id === req.params.id
    );

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found."
        });
    }

    if (req.body.status) {
        order.status = req.body.status;
    }

    saveOrders(orders);

    res.json({
        success: true,
        order
    });
});

app.get("*", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});

app.listen(PORT, () => {

    console.log(`
========================================
 Discord Bot Marketplace
 Server running
 http://localhost:${PORT}
========================================
`);

});
