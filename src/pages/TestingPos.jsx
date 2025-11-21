// import React, { useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Search } from "lucide-react";
// import { toast } from "@/hooks/use-toast";

// /* ---------------------------
//    Inline products (no import)
//    --------------------------- */
// const products = [
//   { id: "1001", name: "Curry Leaves", category: "Vegetables", price: 10.0, emoji: "🌿" },
//   { id: "1002", name: "Sweet Green Corn", category: "Vegetables", price: 25.0, emoji: "🌽" },
//   { id: "1003", name: "Beetroot", category: "Vegetables", price: 30.0, emoji: "🥬" },
//   { id: "1004", name: "Lady Finger", category: "Vegetables", price: 35.0, emoji: "🥒" },
//   { id: "1005", name: "Apple Green", category: "Fruits", price: 120.0, emoji: "🍏" },
//   { id: "1006", name: "Red Round", category: "Fruits", price: 80.0, emoji: "🍅" },
//   { id: "1007", name: "Strawberry", category: "Fruits", price: 150.0, emoji: "🍓" },
//   { id: "1008", name: "Banana Raw", category: "Fruits", price: 40.0, emoji: "🍌" },
//   { id: "1009", name: "Banana Red", category: "Fruits", price: 45.0, emoji: "🍌" },
//   { id: "1010", name: "Banana Yellow", category: "Fruits", price: 42.0, emoji: "🍌" },
//   { id: "1011", name: "Banana Nendran", category: "Fruits", price: 50.0, emoji: "🍌" },
//   { id: "1012", name: "Beans Mixed", category: "Vegetables", price: 60.0, emoji: "🫘" },
//   { id: "1013", name: "Green Beans", category: "Vegetables", price: 55.0, emoji: "🫛" },
//   { id: "1014", name: "Sweet Carrot", category: "Vegetables", price: 32.0, emoji: "🥕" },
//   { id: "1015", name: "Beans Cowpea", category: "Vegetables", price: 48.0, emoji: "🫘" },
//   { id: "1016", name: "Tomato", category: "Vegetables", price: 28.0, emoji: "🍅" },
//   { id: "1017", name: "Brinjal", category: "Vegetables", price: 38.0, emoji: "🍆" },
//   { id: "1018", name: "Bitter Gourd", category: "Vegetables", price: 45.0, emoji: "🥒" },
//   { id: "1019", name: "Bottle Gourd", category: "Vegetables", price: 25.0, emoji: "🥒" },
//   { id: "1020", name: "Broad Beans", category: "Vegetables", price: 70.0, emoji: "🫘" },
//   { id: "1021", name: "Methi Leaves", category: "Vegetables", price: 20.0, emoji: "🌿" },
//   { id: "1022", name: "Spring Onion", category: "Vegetables", price: 30.0, emoji: "🧅" },
//   { id: "1023", name: "Broccoli Bunch", category: "Vegetables", price: 85.0, emoji: "🥦" },
//   { id: "1024", name: "Cabbage", category: "Vegetables", price: 22.0, emoji: "🥬" },
//   { id: "1025", name: "Capsicum Green", category: "Vegetables", price: 65.0, emoji: "🫑" },
//   { id: "1026", name: "Carrot Regular", category: "Vegetables", price: 30.0, emoji: "🥕" },
//   { id: "1027", name: "Cauliflower", category: "Vegetables", price: 40.0, emoji: "🥦" },
//   { id: "1028", name: "Chilli Green Hot", category: "Vegetables", price: 35.0, emoji: "🌶️" },
//   { id: "1029", name: "Chilli Green Mild", category: "Vegetables", price: 32.0, emoji: "🌶️" },
//   { id: "1030", name: "China Onion", category: "Vegetables", price: 18.0, emoji: "🧅" },
//   { id: "1031", name: "Coriander", category: "Vegetables", price: 15.0, emoji: "🌿" },
//   { id: "1032", name: "Corunna", category: "Vegetables", price: 28.0, emoji: "🥬" },
//   { id: "1033", name: "Coriander", category: "Vegetables", price: 15.0, emoji: "🌿" },
//   { id: "1034", name: "Cucumber Fresh", category: "Vegetables", price: 25.0, emoji: "🥒" },
//   { id: "1035", name: "Cucumber Indian", category: "Vegetables", price: 22.0, emoji: "🥒" },
//   { id: "1036", name: "Banana", category: "Fruits", price: 45.0, emoji: "🍌" },
//   { id: "1037", name: "Limes Fresh", category: "Fruits", price: 35.0, emoji: "🍋" },
//   { id: "1038", name: "Coconut Apple", category: "Fruits", price: 40.0, emoji: "🥥" },
//   { id: "1039", name: "Dragon Fruit Red", category: "Fruits", price: 180.0, emoji: "🐉" },
//   { id: "1040", name: "Grapes Red Seedless", category: "Fruits", price: 95.0, emoji: "🍇" },
//   { id: "1041", name: "Drumstick", category: "Vegetables", price: 50.0, emoji: "🥒" },
//   { id: "1042", name: "Mango", category: "Fruits", price: 120.0, emoji: "🥭" },
//   { id: "1043", name: "Garlic", category: "Vegetables", price: 75.0, emoji: "🧄" },
//   { id: "1044", name: "Ginger", category: "Vegetables", price: 60.0, emoji: "🫚" },
//   { id: "1045", name: "Guava", category: "Fruits", price: 55.0, emoji: "🍑" },
//   { id: "1046", name: "Onion", category: "Vegetables", price: 28.0, emoji: "🧅" },
//   { id: "1047", name: "Pumpkin", category: "Vegetables", price: 32.0, emoji: "🎃" },
//   { id: "1048", name: "Pear Yellow", category: "Fruits", price: 110.0, emoji: "🍐" },
//   { id: "1049", name: "Red Plums", category: "Fruits", price: 140.0, emoji: "🍑" },
//   { id: "1050", name: "Lemon", category: "Fruits", price: 38.0, emoji: "🍋" },
//   { id: "1051", name: "Pomelo Honey", category: "Fruits", price: 85.0, emoji: "🍊" },
//   { id: "1052", name: "Mango", category: "Fruits", price: 125.0, emoji: "🥭" },
//   { id: "1053", name: "Musk Lemon", category: "Fruits", price: 45.0, emoji: "🍋" },
// ];

// /* ---------------------------
//    BillingSummary
//    --------------------------- */
// const BillingSummary = ({ itemCount, grossAmount, charges, discount, netAmount, received, balance, changeDue }) => {
//   return (
//     <div className="border-t bg-background p-4" style={{width:"50%"}}>
//       <div className="grid grid-cols-2 gap-4">
//         <div className="space-y-2">
//           <div className="flex justify-between text-sm">
//             <span className="text-muted-foreground">No. Of Items: {itemCount}</span>
//             <span className="font-semibold">Total Qty. = {itemCount}</span>
//           </div>
//           <div className="flex justify-between items-center py-1">
//             <span className="text-sm">Gross Amount</span>
//             <span className="font-semibold">₹{grossAmount.toFixed(2)}</span>
//           </div>
//           <div className="flex justify-between items-center py-1">
//             <span className="text-sm">Charges</span>
//             <span className="font-semibold">{charges.toFixed(2)}</span>
//           </div>
//           <div className="flex justify-between items-center py-1">
//             <span className="text-sm">Discount</span>
//             <span className="font-semibold">{discount.toFixed(2)}</span>
//           </div>
//           <div className="flex justify-between items-center py-2 border-t">
//             <span className="font-semibold">Net Amount</span>
//             <span className="text-xl font-bold">{netAmount.toFixed(2)}</span>
//           </div>
//         </div>

//         <Card className="bg-success p-4 space-y-3">
//           <div className="flex justify-between items-center">
//             <span className="text-success-foreground font-medium">Received</span>
//             <span className="text-success-foreground text-xl font-bold">{received.toFixed(2)}</span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span className="text-success-foreground font-medium">Balance</span>
//             <span className="text-success-foreground font-semibold">{balance.toFixed(2)}</span>
//           </div>
//           <div className="flex justify-between items-center pt-2 border-t border-success-foreground/20">
//             <span className="text-success-foreground font-semibold">Change Due</span>
//             <span className="text-success-foreground text-2xl font-bold">{changeDue.toFixed(2)}</span>
//           </div>
//           <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2">DISC VOUCHER</Button>
//         </Card>
//       </div>
//     </div>
//   );
// };

// const BillingTable = ({ items }) => {
//   return (
//     <ScrollArea className="flex-1" style={{width:"50%"}}>
//       <Table>
//         <TableHeader>
//           <TableRow className="bg-table-header hover:bg-table-header bg-primary">
//             <TableHead className="text-primary-foreground font-semibold w-12">No.</TableHead>
//             <TableHead className="text-primary-foreground font-semibold">Item No.</TableHead>
//             <TableHead className="text-primary-foreground font-semibold">Item Name</TableHead>
//             <TableHead className="text-primary-foreground font-semibold">Lot No.</TableHead>
//             <TableHead className="text-primary-foreground font-semibold text-right">Qty.</TableHead>
//             <TableHead className="text-primary-foreground font-semibold text-right">Sales Price</TableHead>
//             <TableHead className="text-primary-foreground font-semibold text-right">Disc.</TableHead>
//             <TableHead className="text-primary-foreground font-semibold text-right">Tax</TableHead>
//             <TableHead className="text-primary-foreground font-semibold text-right">Amount</TableHead>
//             <TableHead className="text-primary-foreground font-semibold">UOM</TableHead>
//           </TableRow>
//         </TableHeader>

//         <TableBody>
//           {items.map((item, index) => (
//             <TableRow key={index} className={index % 2 === 0 ? "bg-table-row-even" : "bg-table-row-odd"}>
//               <TableCell className="font-medium">{item.no}</TableCell>
//               <TableCell>{item.itemNo}</TableCell>
//               <TableCell>{item.itemName}</TableCell>
//               <TableCell>{item.lotNo}</TableCell>
//               <TableCell className="text-right">{item.qty}</TableCell>
//               <TableCell className="text-right">{item.salesPrice.toFixed(2)}</TableCell>
//               <TableCell className="text-right">{item.disc.toFixed(2)}</TableCell>
//               <TableCell className="text-right">{item.tax.toFixed(2)}</TableCell>
//               <TableCell className="text-right font-semibold">{item.amount.toFixed(2)}</TableCell>
//               <TableCell>{item.uom}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </ScrollArea>
//   );
// };

// /* ---------------------------
//    ProductGrid
//    --------------------------- */
// const ProductGrid = ({ onProductSelect }) => {
//   return (
//     <div className="w-80 bg-card border-r">
//       <ScrollArea className="h-full">
//         <div className="grid grid-cols-3 gap-2 p-3">
//           {products.map((p) => (
//             <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95 p-2 bg-white" onClick={() => onProductSelect(p)}>
//               <div className="flex flex-col items-center gap-1">
//                 <div className="text-3xl">{p.emoji}</div>
//                 <div className="text-[10px] font-medium text-center leading-tight h-8 flex items-center">{p.name}</div>
//               </div>
//             </Card>
//           ))}
//         </div>
//       </ScrollArea>
//     </div>
//   );
// };

// /* ---------------------------
//    Main TESTINGPOS (no POSSidebar)
//    --------------------------- */
// const TESTINGPOS = () => {
//   const [activeTab, setActiveTab] = useState("BILLING");
//   const [billItems, setBillItems] = useState([]);
//   const [customerMobile, setCustomerMobile] = useState("SM15900062706");
//   const [salesperson, setSalesperson] = useState("EMP000001-Sales Person");

//   const tabs = ["BILLING", "RETURN", "ORDER", "LOOKUP", "CASH MGMT", "KPI"];

//   const handleProductSelect = (product) => {
//     const newItem = {
//       no: billItems.length + 1,
//       itemNo: product.id,
//       itemName: product.name,
//       lotNo: "",
//       qty: 1,
//       salesPrice: product.price,
//       disc: 0,
//       tax: product.price * 0.05,
//       amount: product.price + product.price * 0.05,
//       uom: "PC",
//     };
//     setBillItems([...billItems, newItem]);
//     toast({ title: "Item Added", description: `${product.name} added to bill` });
//   };

//   const calculateTotals = () => {
//     const grossAmount = billItems.reduce((s, it) => s + it.salesPrice * it.qty, 0);
//     const totalTax = billItems.reduce((s, it) => s + it.tax, 0);
//     const totalDiscount = billItems.reduce((s, it) => s + it.disc, 0);
//     const netAmount = grossAmount + totalTax - totalDiscount;
//     return { itemCount: billItems.length, grossAmount, charges: 0, discount: totalDiscount, netAmount, received: 0, balance: 0, changeDue: 0 };
//   };

//   const totals = calculateTotals();

//   return (
//     <div className="flex h-screen overflow-hidden bg-background">
//       {/* Main Content */}
//       <div className="flex flex-col flex-1" >
//         {/* Content Area */}
//         <div className="flex flex-1 overflow-hidden">
//           {/* Product Grid */}
//           <ProductGrid onProductSelect={handleProductSelect} />
//           <div className="flex-1 flex flex-col">
//             {/* Search and Customer Info */}
//             <div className="bg-card p-4 border-b space-y-3" style={{width:"50%"}}>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="flex gap-2">
//                   <div className="flex-1">
//                     <label className="text-xs text-muted-foreground mb-1 block">Cust. ID / Mob. No.</label>
//                     <div className="flex gap-2">
//                       <Input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} className="flex-1" />
//                       <Button size="icon" variant="default"><Search className="h-4 w-4" /></Button>
//                     </div>
//                   </div>

//                   <div className="flex-1">
//                     <label className="text-xs text-muted-foreground mb-1 block">Name</label>
//                     <Input placeholder="Customer Name" />
//                   </div>
//                 </div>

//                 <div className="flex gap-2">
//                   <div className="flex-1">
//                     <label className="text-xs text-muted-foreground mb-1 block">Salesperson</label>
//                     <div className="flex gap-2">
//                       <Input value={salesperson} onChange={(e) => setSalesperson(e.target.value)} className="flex-1" />
//                       <Button size="icon" variant="default"><Search className="h-4 w-4" /></Button>
//                     </div>
//                   </div>

//                   <div className="flex-1">
//                     <label className="text-xs text-muted-foreground mb-1 block">Item No.</label>
//                     <div className="flex gap-2">
//                       <Input placeholder="Search Item" />
//                       <Button size="icon" variant="default"><Search className="h-4 w-4" /></Button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <BillingTable items={billItems} />

//             <BillingSummary {...totals} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TESTINGPOS;



import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/* ---------------------------
   Inline products (no import)
   --------------------------- */
const products = [
  { id: "1001", name: "Curry Leaves", category: "Vegetables", price: 10.0, emoji: "🌿" },
  { id: "1002", name: "Sweet Green Corn", category: "Vegetables", price: 25.0, emoji: "🌽" },
  { id: "1003", name: "Beetroot", category: "Vegetables", price: 30.0, emoji: "🥬" },
  { id: "1004", name: "Lady Finger", category: "Vegetables", price: 35.0, emoji: "🥒" },
  { id: "1005", name: "Apple Green", category: "Fruits", price: 120.0, emoji: "🍏" },
  { id: "1006", name: "Red Round", category: "Fruits", price: 80.0, emoji: "🍅" },
  { id: "1007", name: "Strawberry", category: "Fruits", price: 150.0, emoji: "🍓" },
  { id: "1008", name: "Banana Raw", category: "Fruits", price: 40.0, emoji: "🍌" },
  { id: "1009", name: "Banana Red", category: "Fruits", price: 45.0, emoji: "🍌" },
  { id: "1010", name: "Banana Yellow", category: "Fruits", price: 42.0, emoji: "🍌" },
  { id: "1011", name: "Banana Nendran", category: "Fruits", price: 50.0, emoji: "🍌" },
  { id: "1012", name: "Beans Mixed", category: "Vegetables", price: 60.0, emoji: "🫘" },
  { id: "1013", name: "Green Beans", category: "Vegetables", price: 55.0, emoji: "🫛" },
  { id: "1014", name: "Sweet Carrot", category: "Vegetables", price: 32.0, emoji: "🥕" },
  { id: "1015", name: "Beans Cowpea", category: "Vegetables", price: 48.0, emoji: "🫘" },
  { id: "1016", name: "Tomato", category: "Vegetables", price: 28.0, emoji: "🍅" },
  { id: "1017", name: "Brinjal", category: "Vegetables", price: 38.0, emoji: "🍆" },
  { id: "1018", name: "Bitter Gourd", category: "Vegetables", price: 45.0, emoji: "🥒" },
  { id: "1019", name: "Bottle Gourd", category: "Vegetables", price: 25.0, emoji: "🥒" },
  { id: "1020", name: "Broad Beans", category: "Vegetables", price: 70.0, emoji: "🫘" },
  { id: "1021", name: "Methi Leaves", category: "Vegetables", price: 20.0, emoji: "🌿" },
  { id: "1022", name: "Spring Onion", category: "Vegetables", price: 30.0, emoji: "🧅" },
  { id: "1023", name: "Broccoli Bunch", category: "Vegetables", price: 85.0, emoji: "🥦" },
  { id: "1024", name: "Cabbage", category: "Vegetables", price: 22.0, emoji: "🥬" },
  { id: "1025", name: "Capsicum Green", category: "Vegetables", price: 65.0, emoji: "🫑" },
  { id: "1026", name: "Carrot Regular", category: "Vegetables", price: 30.0, emoji: "🥕" },
  { id: "1027", name: "Cauliflower", category: "Vegetables", price: 40.0, emoji: "🥦" },
  { id: "1028", name: "Chilli Green Hot", category: "Vegetables", price: 35.0, emoji: "🌶️" },
  { id: "1029", name: "Chilli Green Mild", category: "Vegetables", price: 32.0, emoji: "🌶️" },
  { id: "1030", name: "China Onion", category: "Vegetables", price: 18.0, emoji: "🧅" },
  { id: "1031", name: "Coriander", category: "Vegetables", price: 15.0, emoji: "🌿" },
  { id: "1032", name: "Corunna", category: "Vegetables", price: 28.0, emoji: "🥬" },
  { id: "1033", name: "Coriander", category: "Vegetables", price: 15.0, emoji: "🌿" },
  { id: "1034", name: "Cucumber Fresh", category: "Vegetables", price: 25.0, emoji: "🥒" },
  { id: "1035", name: "Cucumber Indian", category: "Vegetables", price: 22.0, emoji: "🥒" },
  { id: "1036", name: "Banana", category: "Fruits", price: 45.0, emoji: "🍌" },
  { id: "1037", name: "Limes Fresh", category: "Fruits", price: 35.0, emoji: "🍋" },
  { id: "1038", name: "Coconut Apple", category: "Fruits", price: 40.0, emoji: "🥥" },
  { id: "1039", name: "Dragon Fruit Red", category: "Fruits", price: 180.0, emoji: "🐉" },
  { id: "1040", name: "Grapes Red Seedless", category: "Fruits", price: 95.0, emoji: "🍇" },
  { id: "1041", name: "Drumstick", category: "Vegetables", price: 50.0, emoji: "🥒" },
  { id: "1042", name: "Mango", category: "Fruits", price: 120.0, emoji: "🥭" },
  { id: "1043", name: "Garlic", category: "Vegetables", price: 75.0, emoji: "🧄" },
  { id: "1044", name: "Ginger", category: "Vegetables", price: 60.0, emoji: "🫚" },
  { id: "1045", name: "Guava", category: "Fruits", price: 55.0, emoji: "🍑" },
  { id: "1046", name: "Onion", category: "Vegetables", price: 28.0, emoji: "🧅" },
  { id: "1047", name: "Pumpkin", category: "Vegetables", price: 32.0, emoji: "🎃" },
  { id: "1048", name: "Pear Yellow", category: "Fruits", price: 110.0, emoji: "🍐" },
  { id: "1049", name: "Red Plums", category: "Fruits", price: 140.0, emoji: "🍑" },
  { id: "1050", name: "Lemon", category: "Fruits", price: 38.0, emoji: "🍋" },
  { id: "1051", name: "Pomelo Honey", category: "Fruits", price: 85.0, emoji: "🍊" },
  { id: "1052", name: "Mango", category: "Fruits", price: 125.0, emoji: "🥭" },
  { id: "1053", name: "Musk Lemon", category: "Fruits", price: 45.0, emoji: "🍋" },
];

/* ---------------------------
   BillingSummary
   --------------------------- */
const BillingSummary = ({ itemCount, grossAmount, charges, discount, netAmount, received, balance, changeDue }) => {
  return (
    <div className="border-t bg-background p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">No. Of Items: {itemCount}</span>
            <span className="font-semibold">Total Qty. = {itemCount}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm">Gross Amount</span>
            <span className="font-semibold">₹{grossAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm">Charges</span>
            <span className="font-semibold">{charges.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm">Discount</span>
            <span className="font-semibold">{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t">
            <span className="font-semibold">Net Amount</span>
            <span className="text-xl font-bold">{netAmount.toFixed(2)}</span>
          </div>
        </div>

        <Card className="bg-success p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-success-foreground font-medium">Received</span>
            <span className="text-success-foreground text-xl font-bold">{received.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-success-foreground font-medium">Balance</span>
            <span className="text-success-foreground font-semibold">{balance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-success-foreground/20">
            <span className="text-success-foreground font-semibold">Change Due</span>
            <span className="text-success-foreground text-2xl font-bold">{changeDue.toFixed(2)}</span>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2">DISC VOUCHER</Button>
        </Card>
      </div>
    </div>
  );
};

const BillingTable = ({ items }) => {
  return (
    <ScrollArea className="flex-1 hide-scroll">
      <Table>
        <TableHeader>
          <TableRow className="bg-table-header hover:bg-table-header bg-primary">
            <TableHead className="text-primary-foreground font-semibold w-12">No.</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Item No.</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Item Name</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Lot No.</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">Qty.</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">Sales Price</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">Disc.</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">Tax</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">Amount</TableHead>
            <TableHead className="text-primary-foreground font-semibold">UOM</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index} className={index % 2 === 0 ? "bg-table-row-even" : "bg-table-row-odd"}>
              <TableCell className="font-medium">{item.no}</TableCell>
              <TableCell>{item.itemNo}</TableCell>
              <TableCell>{item.itemName}</TableCell>
              <TableCell>{item.lotNo}</TableCell>
              <TableCell className="text-right">{item.qty}</TableCell>
              <TableCell className="text-right">{item.salesPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right">{item.disc.toFixed(2)}</TableCell>
              <TableCell className="text-right">{item.tax.toFixed(2)}</TableCell>
              <TableCell className="text-right font-semibold">{item.amount.toFixed(2)}</TableCell>
              <TableCell>{item.uom}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

const ProductGrid = ({ onProductSelect }) => {
  return (
    // 50% width
    <div className="w-1/2 min-w-0 bg-card border-r overflow-hidden">
      <ScrollArea className="h-full hide-scroll">
        <div className="grid grid-cols-3 gap-2 p-3">
          {products.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95 p-2 bg-white"
              onClick={() => onProductSelect(p)}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-3xl">{p.emoji}</div>
                <div className="text-[10px] font-medium text-center leading-tight h-8 flex items-center">{p.name}</div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

/* ---------------------------
   Main TESTINGPOS (no POSSidebar)
   --------------------------- */
const TESTINGPOS = () => {
  const [activeTab, setActiveTab] = useState("BILLING");
  const [billItems, setBillItems] = useState([]);
  const [customerMobile, setCustomerMobile] = useState("SM15900062706");
  const [salesperson, setSalesperson] = useState("EMP000001-Sales Person");

  const tabs = ["BILLING", "RETURN", "ORDER", "LOOKUP", "CASH MGMT", "KPI"];

  const handleProductSelect = (product) => {
    const newItem = {
      no: billItems.length + 1,
      itemNo: product.id,
      itemName: product.name,
      lotNo: "",
      qty: 1,
      salesPrice: product.price,
      disc: 0,
      tax: product.price * 0.05,
      amount: product.price + product.price * 0.05,
      uom: "PC",
    };
    setBillItems([...billItems, newItem]);
    toast({ title: "Item Added", description: `${product.name} added to bill` });
  };

  const calculateTotals = () => {
    const grossAmount = billItems.reduce((s, it) => s + it.salesPrice * it.qty, 0);
    const totalTax = billItems.reduce((s, it) => s + it.tax, 0);
    const totalDiscount = billItems.reduce((s, it) => s + it.disc, 0);
    const netAmount = grossAmount + totalTax - totalDiscount;
    return { itemCount: billItems.length, grossAmount, charges: 0, discount: totalDiscount, netAmount, received: 0, balance: 0, changeDue: 0 };
  };

  const totals = calculateTotals();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Embedded CSS to hide native scrollbars (no external file) */}
      <style>
        {`
          /* hide-scroll: hides native scrollbars (IE/Edge, Firefox, WebKit) while keeping scrolling functional */
          .hide-scroll {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;     /* Firefox */
          }
          .hide-scroll::-webkit-scrollbar {
            display: none;             /* Chrome, Safari, Opera */
          }
        `}
      </style>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full">
        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden w-full">
          {/* Product Grid (50%) */}
          <ProductGrid onProductSelect={handleProductSelect} />

          {/* Billing Area (50%) */}
          <div className="w-1/2 min-w-0 flex flex-col overflow-hidden">
            {/* Search and Customer Info */}
            <div className="bg-card p-4 border-b space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Cust. ID / Mob. No.</label>
                    <div className="flex gap-2">
                      <Input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} className="flex-1" />
                      <Button size="icon" variant="default"><Search className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                    <Input placeholder="Customer Name" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Salesperson</label>
                    <div className="flex gap-2">
                      <Input value={salesperson} onChange={(e) => setSalesperson(e.target.value)} className="flex-1" />
                      <Button size="icon" variant="default"><Search className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Item No.</label>
                    <div className="flex gap-2">
                      <Input placeholder="Search Item" />
                      <Button size="icon" variant="default"><Search className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Table */}
            <BillingTable items={billItems} />

            {/* Summary */}
            <BillingSummary {...totals} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TESTINGPOS;
