
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Printer, X, Plus, Trash2, Building2 } from "lucide-react";
import { useDivision } from "@/context/DivisionContext";
import { cn } from "@/lib/utils";

function indianNumberFormat(n: number): string {
  const parts = n.toFixed(2).split(".");
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== "") lastThree = "," + lastThree;
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + "." + parts[1];
  return res;
}

function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: any): string => {
    if ((n = n.toString()).length > 9) return 'overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (Number(n_array[1]) != 0) ? (a[Number(n_array[1])] || b[Number(n_array[1][0])] + ' ' + a[Number(n_array[1][1])]) + 'Crore ' : '';
    str += (Number(n_array[2]) != 0) ? (a[Number(n_array[2])] || b[Number(n_array[2][0])] + ' ' + a[Number(n_array[2][1])]) + 'Lakh ' : '';
    str += (Number(n_array[3]) != 0) ? (a[Number(n_array[3])] || b[Number(n_array[3][0])] + ' ' + a[Number(n_array[3][1])]) + 'Thousand ' : '';
    str += (Number(n_array[4]) != 0) ? (a[Number(n_array[4])] || b[Number(n_array[4][0])] + ' ' + a[Number(n_array[4][1])]) + 'Hundred ' : '';
    str += (Number(n_array[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[Number(n_array[5][0])] + ' ' + a[Number(n_array[5][1])]) : '';
    return str;
  };

  return "RUPEES " + inWords(Math.floor(num)).toUpperCase() + "ONLY";
}

export default function InvoiceGeneratorPage() {
  const { activeDivision } = useDivision();
  const [items, setItems] = useState([{ id: 1, description: "", amount: 0, hsn: "9954" }]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null);

  const addItem = () => {
    setItems([...items, { id: items.length + 1, description: "", amount: 0, hsn: "9954" }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const totalBase = items.reduce((acc, i) => acc + i.amount, 0);
    
    setInvoiceToPrint({
      invoiceNumber: formData.get("invoiceNumber"),
      expenseDate: formData.get("date"),
      clientName: formData.get("clientName"),
      clientGstin: formData.get("clientGstin"),
      description: items[0]?.description || "General Construction Services",
      amount: totalBase,
      items: items
    });
  };

  const getInvoiceCalculations = (amount: number) => {
    const subtotal = amount;
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const tds = subtotal * 0.02; 
    const totalPayable = subtotal + cgst + sgst - tds;
    return { subtotal, cgst, sgst, tds, totalPayable };
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <header>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase">Tax Invoice Hub</h1>
              <p className="text-muted-foreground">Generate professional fiscal documents for {activeDivision.name}.</p>
            </header>

            <Card className="glass border-white/5 p-8 rounded-[2.5rem]">
              <form onSubmit={handleGenerate} className="space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Invoice Number</Label>
                    <Input name="invoiceNumber" placeholder="NC-2025-000" required className="bg-white/5 border-white/10 rounded-2xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Date</Label>
                    <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 rounded-2xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">GST Class</Label>
                    <Select defaultValue="18">
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="18">Standard (9% + 9%)</SelectItem>
                        <SelectItem value="12">Reduced (6% + 6%)</SelectItem>
                        <SelectItem value="5">Cess (2.5% + 2.5%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Billing Details</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs">Client Name</Label>
                      <Input name="clientName" placeholder="Entity Name" required className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Client GSTIN</Label>
                      <Input name="clientGstin" placeholder="32XXXXXXXXX" className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Line Items</p>
                    <Button type="button" onClick={addItem} variant="ghost" className="text-[10px] uppercase font-bold tracking-widest">
                      <Plus className="h-3 w-3 mr-2" /> Add Item
                    </Button>
                  </div>
                  {items.map((item, idx) => (
                    <div key={item.id} className="grid md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-left duration-300">
                      <div className="md:col-span-1">
                        <Input disabled value={idx + 1} className="bg-white/5 border-transparent text-center opacity-50" />
                      </div>
                      <div className="md:col-span-6">
                        <Input 
                          placeholder="Description of Work" 
                          value={item.description} 
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].description = e.target.value;
                            setItems(newItems);
                          }}
                          className="bg-white/5 border-white/10 rounded-xl" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input 
                          placeholder="HSN" 
                          value={item.hsn}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].hsn = e.target.value;
                            setItems(newItems);
                          }}
                          className="bg-white/5 border-white/10 rounded-xl font-mono text-xs" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input 
                          type="number" 
                          placeholder="Amount" 
                          value={item.amount || ""}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].amount = Number(e.target.value);
                            setItems(newItems);
                          }}
                          className="bg-white/5 border-white/10 rounded-xl font-mono" 
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full h-16 rounded-3xl gold-gradient text-black font-black text-lg shadow-xl shadow-primary/20">
                  Preview & Generate Invoice
                </Button>
              </form>
            </Card>
          </div>
        </main>
      </div>

      {invoiceToPrint && (() => {
        const calcs = getInvoiceCalculations(invoiceToPrint.amount);
        
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 print:p-0 print:bg-white overflow-y-auto">
            <Card className="w-full max-w-4xl bg-[#FDFBF7] text-[#0C0A07] overflow-hidden rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans border-none">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 print:hidden h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-full z-[110]" 
                onClick={() => setInvoiceToPrint(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="bg-[#0C0A07] p-10 md:p-12 text-[#FDFBF7] flex justify-between items-start border-b-[2px] border-[#C9A84C] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#C9A84C]" />
                <div className="flex gap-8 items-center relative z-10">
                  <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center border-2 border-[#C9A84C] p-2">
                    <div className="h-full w-full bg-[#0C0A07] rounded-full flex items-center justify-center">
                      <span className="text-3xl font-black text-[#C9A84C]">NH</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-[#C9A84C] uppercase leading-none">
                      NALAKATH CONSTRUCTIONS
                    </h1>
                    <p className="text-sm font-bold text-zinc-400 italic">Private Limited</p>
                    <div className="mt-3 h-[0.6px] w-[300px] bg-[#C9A84C]" />
                    <p className="text-[11px] text-[#F0E4B8] font-bold tracking-widest pt-2 uppercase italic">
                      Building Trust. Building Kerala.
                    </p>
                    <p className="text-[10px] text-[#F5EDD6] font-medium leading-relaxed max-w-md mt-2">
                      Nalakath Hub, Ward No. 4, Areecode, Malappuram, Kerala 673639<br />
                      +91 97444 00100   |   info@nalakathindia.com   |   GSTIN: 32XXXXXX1234Z5
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#C9A84C] px-10 py-3 flex justify-between items-center shadow-md">
                <h2 className="text-xl font-black text-[#0C0A07] uppercase tracking-widest">TAX INVOICE</h2>
                <div className="flex gap-4 text-[9px] font-black text-[#0C0A07] uppercase opacity-80">
                  <span>Original for Recipient</span>
                  <span className="border-l border-black/20 pl-4">CGST + SGST</span>
                  <span className="border-l border-black/20 pl-4">Malappuram Jurisdiction</span>
                </div>
              </div>

              <div className="p-10 md:p-12 pb-6 space-y-10">
                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm bg-[#FDFBF7]">
                      <div className="bg-[#C9A84C] px-4 py-1.5">
                        <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">INVOICE DETAILS</h3>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-y-3 text-[11px]">
                        <span className="font-bold text-[#6B5C42] uppercase">Invoice Number:</span>
                        <span className="font-black text-[#0C0A07]">{invoiceToPrint.invoiceNumber}</span>
                        <span className="font-bold text-[#6B5C42] uppercase">Invoice Date:</span>
                        <span className="font-black text-[#0C0A07]">{new Date(invoiceToPrint.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="font-bold text-[#6B5C42] uppercase">Due Date:</span>
                        <span className="font-black text-[#0C0A07]">{new Date(invoiceToPrint.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="font-bold text-[#6B5C42] uppercase">Payment Terms:</span>
                        <span className="font-black text-[#0C0A07]">Net 30 Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm h-full bg-[#FDFBF7]">
                      <div className="bg-[#C9A84C] px-4 py-1.5">
                        <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">BILL TO</h3>
                      </div>
                      <div className="p-4 h-full">
                        <p className="text-lg font-black text-[#0C0A07] uppercase leading-tight mb-2">
                          {invoiceToPrint.clientName}
                        </p>
                        <p className="text-[11px] font-bold text-[#6B5C42] uppercase leading-relaxed">
                          Infrastructure & Portfolio Development Unit<br />
                          {invoiceToPrint.clientGstin ? `GSTIN: ${invoiceToPrint.clientGstin}` : "Unregistered / Internal Transfer"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#CEBB8A]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0C0A07] text-[#C9A84C]">
                      <tr>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest w-12 border-r border-white/10 text-center">#</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10">Description of Work / Materials</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">HSN/SAC</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0D4B0]">
                      {invoiceToPrint.items.map((item: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#F7F2E8]"}>
                          <td className="p-4 text-xs font-black text-[#6B5C42] border-r border-[#F7F2E8] text-center">{idx + 1}</td>
                          <td className="p-4 border-r border-[#F7F2E8]">
                            <p className="text-xs font-black text-[#0C0A07] uppercase">{item.description}</p>
                          </td>
                          <td className="p-4 text-center text-xs font-mono text-[#0C0A07] border-r border-[#F7F2E8]">{item.hsn}</td>
                          <td className="p-4 text-right text-xs font-mono font-black">{indianNumberFormat(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-6">
                  <div className="w-96 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold px-4">
                      <span className="text-[#6B5C42] uppercase tracking-widest">Subtotal (before GST)</span>
                      <span className="font-mono text-[#0C0A07]">Rs. {indianNumberFormat(calcs.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold px-4">
                      <span className="text-[#6B5C42] uppercase tracking-widest">CGST @ 9%</span>
                      <span className="font-mono text-[#0C0A07]">Rs. {indianNumberFormat(calcs.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold px-4">
                      <span className="text-[#6B5C42] uppercase tracking-widest">SGST @ 9%</span>
                      <span className="font-mono text-[#0C0A07]">Rs. {indianNumberFormat(calcs.sgst)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold px-4 border-b border-[#E0D4B0] pb-3">
                      <span className="text-[#A02818] uppercase tracking-widest">TDS Deductible (Sec. 194C)</span>
                      <span className="font-mono text-[#A02818]">- Rs. {indianNumberFormat(calcs.tds)}</span>
                    </div>
                    <div className="bg-[#0C0A07] p-5 rounded-lg text-[#C9A84C] flex justify-between items-center shadow-lg border-l-[8px] border-[#C9A84C]">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">TOTAL AMOUNT PAYABLE</p>
                        <p className="text-3xl font-black tracking-tighter leading-none text-[#DFC06A]">Rs. {indianNumberFormat(calcs.totalPayable)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F0E4B8] px-6 py-3 rounded-lg border border-[#CEBB8A] flex items-center gap-4">
                  <span className="text-[10px] font-black text-[#6B5C42] uppercase tracking-widest">Amount In Words:</span>
                  <p className="text-xs font-black text-[#0C0A07] uppercase italic">{numberToWords(calcs.totalPayable)}</p>
                </div>

                <footer className="pt-16 flex justify-between items-end">
                  <div className="max-w-xs">
                    <p className="text-[10px] leading-relaxed text-[#6B5C42] font-bold italic border-t border-[#E0D4B0] pt-4">
                      We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct to the best of our knowledge.
                    </p>
                  </div>
                  <div className="text-center space-y-6">
                    <div className="h-20 w-20 border-[3px] border-[#C9A84C]/40 rounded-full flex items-center justify-center mx-auto opacity-40 -rotate-12">
                      <p className="text-[9px] font-black text-[#C9A84C] uppercase text-center leading-none">Verified<br/>Audit<br/>2026</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-[0.8px] w-56 bg-[#CEBB8A] mx-auto" />
                      <p className="text-[11px] font-black text-[#0C0A07] uppercase tracking-widest">Authorised Signatory</p>
                      <p className="text-[9px] font-bold text-[#6B5C42] uppercase">For Nalakath Constructions Pvt. Ltd.</p>
                    </div>
                  </div>
                </footer>
              </div>

              <div className="bg-[#0C0A07] py-4 px-10 text-white flex justify-between items-center print:border-t-0 border-t border-white/10">
                <p className="text-[9px] font-black tracking-[0.2em] text-[#DFC06A]">
                  NALAKATH CONSTRUCTIONS PVT. LTD.
                </p>
                <div className="flex gap-6 text-[8px] font-bold text-[#F5EDD6] uppercase tracking-widest">
                  <span>Areecode, Malappuram</span>
                  <span>+91 97444 00100</span>
                  <span>nalakathindia.com</span>
                  <span className="text-[#C9A84C]">Page 1 of 1</span>
                </div>
              </div>

              <div className="print:hidden flex gap-4 justify-end p-8 border-t border-zinc-100 bg-zinc-50 mt-10">
                <Button variant="outline" className="rounded-full px-8 gap-2 border-zinc-300 h-14 font-black uppercase text-[11px] tracking-widest hover:bg-zinc-100" onClick={() => setInvoiceToPrint(null)}>
                  Discard Preview
                </Button>
                <Button className="rounded-full px-12 gap-3 h-14 font-black uppercase text-[11px] tracking-widest bg-[#0C0A07] text-[#C9A84C] hover:bg-black shadow-2xl shadow-black/20" onClick={() => window.print()}>
                  <Printer className="h-5 w-5" /> Save PDF / Print
                </Button>
              </div>
            </Card>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
