export const brands = [
  {
    id: 1,
    prefix: "POR",
    name: "PorSor Company",
    color: "#2563eb",
    employees: [
      "001 - ដែប សុភា (Sale Rep)",
      "002 - លីម វិចិត្រ (Manager)",
      "003 - Leehng (Cashier)",
      "004 - Voleak (Sale Rep)",
    ],
    customers: [
      { id: "001", name: "ស្រីមុំ", tel: "0887874000", addr: "Kampong Speu", creditLimit: 5000, depositBal: 200, invoiceBal: 1200 },
      { id: "002", name: "David", tel: "078737271", addr: "Battambang", creditLimit: 3000, depositBal: 0, invoiceBal: 450 },
      { id: "003", name: "Lida", tel: "012395964", addr: "Phnom Penh", creditLimit: 8000, depositBal: 500, invoiceBal: 0 },
    ],
    products: [
      { id: "P001", name: "Drinking Water 600ml", uom: "Ctn", price: 4.5 },
      { id: "P002", name: "Drinking Water 1.5L", uom: "Ctn", price: 7.0 },
      { id: "P003", name: "Sparkling Water 330ml", uom: "Ctn", price: 12.0 },
      { id: "P004", name: "Juice Orange 250ml", uom: "Ctn", price: 9.5 },
      { id: "P005", name: "Soda Can 330ml", uom: "Ctn", price: 8.0 },
    ],
  },
  {
    id: 2,
    prefix: "ABC",
    name: "ABC Trading Co.",
    color: "#059669",
    employees: [
      "001 - Sokha (Manager)",
      "002 - Dara (Sale Rep)",
      "003 - Maly (Cashier)",
    ],
    customers: [
      { id: "001", name: "Mr. Chan", tel: "012000111", addr: "Siem Reap", creditLimit: 10000, depositBal: 1000, invoiceBal: 2300 },
      { id: "002", name: "Ms. Bopha", tel: "096555666", addr: "Phnom Penh", creditLimit: 6000, depositBal: 300, invoiceBal: 0 },
      { id: "003", name: "Kimheng Store", tel: "017333444", addr: "Kandal", creditLimit: 4000, depositBal: 0, invoiceBal: 800 },
    ],
    products: [
      { id: "P001", name: "Rice 25kg", uom: "Bag", price: 18.0 },
      { id: "P002", name: "Sugar 1kg", uom: "Pcs", price: 1.2 },
      { id: "P003", name: "Cooking Oil 5L", uom: "Btl", price: 8.5 },
      { id: "P004", name: "Salt 500g", uom: "Pcs", price: 0.8 },
      { id: "P005", name: "Flour 1kg", uom: "Pcs", price: 1.5 },
    ],
  },
  {
    id: 3,
    prefix: "KHM",
    name: "Khmer Goods Ltd.",
    color: "#dc2626",
    employees: [
      "001 - Ratha (Director)",
      "002 - Vanna (Manager)",
      "003 - Pisey (Sale Rep)",
    ],
    customers: [
      { id: "001", name: "Star Mart", tel: "023222333", addr: "Phnom Penh", creditLimit: 20000, depositBal: 2000, invoiceBal: 5400 },
      { id: "002", name: "Lucky Shop", tel: "011999888", addr: "Battambang", creditLimit: 8000, depositBal: 500, invoiceBal: 1200 },
    ],
    products: [
      { id: "P001", name: "Coffee Beans 1kg", uom: "Bag", price: 12.0 },
      { id: "P002", name: "Tea Leaves 500g", uom: "Box", price: 6.5 },
      { id: "P003", name: "Coconut Milk 400ml", uom: "Can", price: 2.2 },
      { id: "P004", name: "Fish Sauce 700ml", uom: "Btl", price: 3.0 },
    ],
  },
];

export function generateRefNo(prefix) {
  const d = new Date();
  const dateStr =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, "0")}` +
    `${String(d.getDate()).padStart(2, "0")}`;
  const key = `so_seq_${prefix}_${dateStr}`;
  const seq = parseInt(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(seq));
  return `${prefix}SO${dateStr}${String(seq).padStart(5, "0")}`;
}
