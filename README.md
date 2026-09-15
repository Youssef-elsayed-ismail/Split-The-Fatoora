# 🧾 Split Fatoora

> **Split the bill, not the friendship.**
🔗🔗>>Link for the demo video:
https://drive.google.com/drive/folders/1X4PAst_joXduK-EHA4MVAOOp0y42HqnH
**Split Fatoora** is a smart receipt-splitting web application that makes splitting restaurant bills with friends simple and accurate.

Upload or scan a receipt, review the detected items and charges, add your friends, assign items to each person, and instantly see exactly how much everyone should pay — including **VAT, service charges, and other fees**.

---

## ✨ Features

* 🧾 **Receipt Management**
  Load a receipt and review its items, prices, VAT, service charges, and other charges.

* 📷 **Receipt OCR Scanning**
  Scan or upload a receipt and extract its information automatically using OCR.

* 👥 **Add Friends**
  Add everyone participating in the bill split.

* 🍔 **Item Assignment**
  Assign individual items to the people who ordered them.

* 🤝 **Shared Items**
  Items shared by multiple people are automatically divided equally between them.

* 💰 **Automatic Bill Calculation**
  Calculates exactly how much each person owes.

* 🧮 **VAT & Service Charges**
  VAT, service charges, and other fees are distributed proportionally according to each person's share.

* 🎯 **Accurate Calculations**
  Calculations are performed using integer cents and a largest-remainder allocation method, ensuring that everyone's shares add up exactly to the original receipt total.

* ⚠️ **Unassigned Items Detection**
  Items that haven't been assigned to anyone are clearly identified instead of being accidentally ignored.

* 📊 **Detailed Results**
  View a complete breakdown of each person's items, charges, and final amount.

---

## 📱 Try It on Mobile

You can also run **Split Fatoora directly on your mobile phone** using an **ngrok public tunnel**.

> 📌 **Mobile Demo:**
> **[👉((https://raking-scoured-cupcake.ngrok-free.dev/))**

Simply open the link above from your phone's browser to access the application.

### 🌐 How It Works

```text
Your Computer
     │
     │  Local Development Server
     ▼
 Split Fatoora
     │
     │  ngrok Tunnel
     ▼
  🌍 Public URL
     │
     ▼
📱 Mobile Phone
```

The ngrok link allows your locally running application to be temporarily accessible from other devices, including mobile phones.

> **Note:** The ngrok URL may change whenever a new tunnel is created. Replace [](https://raking-scoured-cupcake.ngrok-free.dev/) with your current ngrok URL.

---

## 🔄 How It Works

Split Fatoora uses a simple step-by-step workflow:

```text
Receipt
   ↓
Review Items & Charges
   ↓
Add People
   ↓
Assign Items
   ↓
Calculate Shares
   ↓
View Final Results
```

### 1. 🧾 Load Your Receipt

Start by uploading/scanning a receipt or creating one manually.

### 2. 🔍 Review the Receipt

Check and edit:

* Item names
* Item prices
* VAT
* Service charges
* Other charges

### 3. 👥 Add People

Add all friends participating in the bill.

### 4. 🍕 Assign Items

Assign each item to the person who ordered it.

If an item was shared, assign it to multiple people and the cost will be divided equally.

### 5. 💵 See the Results

The application calculates each person's total and provides a detailed breakdown of the final bill.

---


## 🛠️ Tech Stack

### Frontend

* **React**
* **TypeScript**
* **CSS Modules**
* **HTML5**

### Development Tools

* **Node.js**
* **npm**
* **Vite**
* **ngrok** — for mobile/device testing through a public tunnel

### Architecture

The application is organized into separate layers for UI, state management, business logic, data, and types:

```text
src/
├── screens/       # Application screens/routes
├── components/    # Reusable UI components
├── lib/           # Calculation, validation & money utilities
├── state/         # Application state management
├── data/          # Receipt/mock data
└── types/         # TypeScript types
```

---

## 🧮 Calculation Logic

Split Fatoora is designed to make the final bill mathematically accurate.

### Item Splitting

Each item is divided equally between everyone assigned to it.

For example:

```text
Pizza = 300 EGP
Shared by 3 people

Each person = 100 EGP
```

### Charges

VAT, service charges, and other additional charges are distributed **proportionally** based on how much each person ordered.

This means someone who ordered more food will automatically receive a larger portion of the additional charges.

### Exact Reconciliation

The application performs its calculations using integer cents and uses the **largest-remainder method** to distribute rounding differences.

This ensures:

```text
Sum of everyone's payment
        =
Original receipt total
```

No missing cents. No unexplained rounding differences.

---

## 🚀 Installation

### Prerequisites

Make sure you have installed:

* [Node.js](https://nodejs.org/)
* npm
* [ngrok](https://ngrok.com/) — optional, only required for mobile/device access

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/split-fatoora.git
```

Navigate into the project:

```bash
cd split-fatoora
```

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

The application will then be available through the local development URL provided by Vite.

---

## 📱 Run on a Mobile Phone with ngrok

After starting the development server, use ngrok to expose your local application.

For example, if your development server is running on port `5173`:

```bash
ngrok http 5173
```

ngrok will provide a public forwarding URL similar to:

```text
https://example.ngrok-free.app
```

Open that URL on your mobile phone to access **Split Fatoora**.

> Make sure your development server is running while using the ngrok link.

---

## 📦 Available Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm install`   | Install project dependencies             |
| `npm run dev`   | Start the development server             |
| `npm run build` | Type-check and create a production build |
| `npm run test`  | Run calculation and state tests          |
| `npm run lint`  | Run ESLint                               |

---

## 🧪 Testing

The project includes tests for the application's calculation and state logic.

Run the tests with:

```bash
npm run test
```

Build the application with:

```bash
npm run build
```

---

## 🗺️ Application Routes

| Route      | Screen          | Description                           |
| ---------- | --------------- | ------------------------------------- |
| `/`        | Home            | Load a receipt or start one manually  |
| `/review`  | Receipt Review  | Review and edit receipt information   |
| `/people`  | People          | Add people participating in the split |
| `/assign`  | Item Assignment | Assign items to people                |
| `/results` | Results         | View each person's final payment      |

---

## 🔮 Future Improvements

Planned improvements include:

* 📷 Full OCR receipt processing
* 🔐 User authentication
* 💳 Integrated payments
* 🗄️ Database support
* 💬 Chat or group bill-splitting features
* 📱 Improved mobile experience
* 🌐 Production deployment

---

## 🎯 Project Goal

Splitting a restaurant bill shouldn't require doing complicated calculations or arguing over who owes what.

**Split Fatoora** was built to make the process:

> **Scan → Assign → Calculate → Pay**

Simple, transparent, and accurate.

---

## 👨‍💻 Contributing

Contributions, suggestions, and improvements are welcome.

If you'd like to contribute:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Commit your changes
5. Push the branch
6. Open a Pull Request

---

## 📄 License

This project is currently available for educational and development purposes.
