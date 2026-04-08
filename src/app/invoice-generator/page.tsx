
"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Printer, X, Plus, Trash2, Building2, Landmark, User, CreditCard } from "lucide-react";
import { useDivision } from "@/context/DivisionContext";
import { cn } from "@/lib/utils";

// --- UTILITIES (Ported from Python Model) ---

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
  const [items, setItems] = useState([{ id: Date.now(), description: "", hsn: "9954", qty: 1, unit: "Cu.m", rate: 0, gst: 18 }]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", hsn: "9954", qty: 1, unit: "Cu.m", rate: 0, gst: 18 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Exact mapping from Python data collection
    const d = {
      inv_no: formData.get("inv_no"),
      inv_date: formData.get("inv_date"),
      payment_terms: formData.get("terms") || "Net 30 Days",
      project_ref: formData.get("proj_ref"),
      project_desc: formData.get("proj_desc"),
      // Seller
      s_name: "Nalakath Constructions Pvt. Ltd.",
      s_addr1: "Nalakath Hub, Ward No. 4, Areecode",
      s_addr2: "Malappuram, Kerala 673639",
      s_phone: "+91 97444 00100",
      s_email: "info@nalakathindia.com",
      s_gstin: "32XXXXXX1234Z5",
      // Buyer
      b_name: formData.get("b_name"),
      b_attn: formData.get("b_attn"),
      b_addr1: formData.get("b_addr1"),
      b_addr2: formData.get("b_addr2"),
      b_city: formData.get("b_city"),
      b_state: formData.get("b_state") || "Kerala",
      b_pin: formData.get("b_pin"),
      b_gstin: formData.get("b_gstin"),
      b_po: formData.get("b_po"),
      // Bank
      bk_name: formData.get("bk_name") || "State Bank of India, Perinthalmanna",
      bk_acnm: formData.get("bk_acnm") || "Nalakath Constructions Pvt. Ltd.",
      bk_acno: formData.get("bk_acno") || "32XXXXXXXXXX51",
      bk_ifsc: formData.get("bk_ifsc") || "SBIN0001234",
      bk_type: formData.get("bk_type") || "Current Account",
      // Adjustments
      tds_percent: Number(formData.get("tds")) || 2.0,
      discount_percent: Number(formData.get("disc")) || 0.0,
      additional_charges: Number(formData.get("extra")) || 0.0,
      additional_label: formData.get("extra_lbl") || "Additional Charges",
      jurisdiction: formData.get("jur") || "Malappuram",
      notes: formData.get("notes"),
      items: items
    };

    setInvoiceToPrint(d);
  };

  const totals = useMemo(() => {
    if (!invoiceToPrint) return null;
    const subtotal = invoiceToPrint.items.reduce((acc: number, i: any) => acc + (i.qty * i.rate), 0);
    const disc_amt = (subtotal * invoiceToPrint.discount_percent) / 100;
    const taxable = subtotal - disc_amt;
    
    let cgst = 0, sgst = 0;
    invoiceToPrint.items.forEach((i: any) => {
      const line_taxable = (i.qty * i.rate * (1 - invoiceToPrint.discount_percent / 100));
      const line_gst = (line_taxable * i.gst) / 100;
      cgst += line_gst / 2;
      sgst += line_gst / 2;
    });

    const tds_amt = (taxable * invoiceToPrint.tds_percent) / 100;
    const total_gst = cgst + sgst;
    const final = taxable + total_gst + invoiceToPrint.additional_charges - tds_amt;

    return { subtotal, disc_amt, taxable, cgst, sgst, tds_amt, total_gst, final };
  }, [invoiceToPrint]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <header className="flex flex-col gap-2">
              <Badge variant="outline" className="w-fit rounded-full px-4 py-1 text-[9px] uppercase tracking-widest font-bold border-primary/40 text-primary bg-primary/5">
                FISCAL ENGINE V4.0
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase mt-2">Tax Invoice Hub</h1>
              <p className="text-muted-foreground text-sm">Professional PDF generator for {activeDivision.name}.</p>
            </header>

            <Card className="glass border-white/5 p-8 rounded-[3rem]">
              <form onSubmit={handleGenerate} className="space-y-10">
                
                {/* 1. Invoice Details */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">1 / 6 — Invoice Metadata</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Invoice Number</Label>
                      <Input name="inv_no" placeholder="NC-2025-0001" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Invoice Date</Label>
                      <Input name="inv_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Terms</Label>
                      <Input name="terms" defaultValue="Net 30 Days" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Project Reference</Label>
                      <Input name="proj_ref" placeholder="PROJ-000" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Project Description</Label>
                      <Input name="proj_desc" placeholder="Work details for header" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                </div>

                {/* 2. Bill To */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">2 / 6 — Bill To (Client)</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Client / Company Name</Label>
                      <Input name="b_name" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Attention (Contact Person)</Label>
                      <Input name="b_attn" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2 col-span-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Address Line 1</Label>
                      <Input name="b_addr1" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">City</Label>
                      <Input name="b_city" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">PIN Code</Label>
                      <Input name="b_pin" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">GSTIN (Optional)</Label>
                      <Input name="b_gstin" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">PO Reference</Label>
                      <Input name="b_po" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                </div>

                {/* 3. Bank Details */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <Landmark className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">3 / 6 — Bank & Settlement</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Bank Name</Label>
                      <Input name="bk_name" defaultValue="State Bank of India, Perinthalmanna" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Account Number</Label>
                      <Input name="bk_acno" defaultValue="32XXXXXXXXXX51" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                </div>

                {/* 4. Line Items */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-black uppercase tracking-widest">4 / 6 — Line Items</h3>
                    </div>
                    <Button type="button" onClick={addItem} variant="ghost" className="text-[10px] uppercase font-bold tracking-widest">
                      <Plus className="h-3 w-3 mr-2" /> Add Service
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div key={item.id} className="grid md:grid-cols-12 gap-4 items-end bg-white/5 p-4 rounded-2xl animate-in slide-in-from-left duration-300">
                        <div className="md:col-span-1">
                          <Input disabled value={idx + 1} className="bg-transparent border-none text-center font-black opacity-30 h-10" />
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-[8px] uppercase font-bold ml-1">Description</Label>
                          <Input 
                            required
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx].description = e.target.value;
                              setItems(newItems);
                            }}
                            className="bg-white/5 border-white/10 rounded-xl h-10"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[8px] uppercase font-bold ml-1">HSN/SAC</Label>
                          <Input 
                            value={item.hsn}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx].hsn = e.target.value;
                              setItems(newItems);
                            }}
                            className="bg-white/5 border-white/10 rounded-xl h-10 font-mono text-xs"
                          />
                        </div>
                        <div className="md:col-span-1 space-y-1">
                          <Label className="text-[8px] uppercase font-bold ml-1">Qty</Label>
                          <Input 
                            type="number"
                            value={item.qty}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx].qty = Number(e.target.value);
                              setItems(newItems);
                            }}
                            className="bg-white/5 border-white/10 rounded-xl h-10"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[8px] uppercase font-bold ml-1">Rate (₹)</Label>
                          <Input 
                            type="number"
                            value={item.rate || ""}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx].rate = Number(e.target.value);
                              setItems(newItems);
                            }}
                            className="bg-white/5 border-white/10 rounded-xl h-10 font-mono"
                          />
                        </div>
                        <div className="md:col-span-1 space-y-1">
                          <Label className="text-[8px] uppercase font-bold ml-1">GST %</Label>
                          <Input 
                            type="number"
                            value={item.gst}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx].gst = Number(e.target.value);
                              setItems(newItems);
                            }}
                            className="bg-white/5 border-white/10 rounded-xl h-10 font-mono"
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Adjustments */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">5 / 6 — Adjustments & Tax</h3>
                  </div>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">TDS % (Sec. 194C)</Label>
                      <Input name="tds" type="number" step="0.1" defaultValue="2.0" className="bg-white/5 border-white/10 h-12 rounded-2xl font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Discount %</Label>
                      <Input name="disc" type="number" step="0.1" defaultValue="0.0" className="bg-white/5 border-white/10 h-12 rounded-2xl font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Addl. Charges (₹)</Label>
                      <Input name="extra" type="number" step="0.01" defaultValue="0.0" className="bg-white/5 border-white/10 h-12 rounded-2xl font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Jurisdiction</Label>
                      <Input name="jur" defaultValue="Malappuram" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                </div>

                {/* 6. Notes */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">6 / 6 — Additional Notes</h3>
                  </div>
                  <Textarea name="notes" placeholder="Any additional terms or declaration details..." className="bg-white/5 border-white/10 rounded-[2rem] min-h-[100px]" />
                </div>

                <Button type="submit" className="w-full h-20 rounded-[2.5rem] gold-gradient text-black font-black text-xl shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-transform">
                  Generate Professional Preview
                </Button>
              </form>
            </Card>
          </div>
        </main>
      </div>

      {invoiceToPrint && totals && (
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
            
            {/* Header - Ported from Python Model */}
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

            {/* Title Band */}
            <div className="bg-[#C9A84C] px-10 py-3 flex justify-between items-center shadow-md">
              <h2 className="text-xl font-black text-[#0C0A07] uppercase tracking-widest">TAX INVOICE</h2>
              <div className="flex gap-4 text-[9px] font-black text-[#0C0A07] uppercase opacity-80">
                <span>Original for Recipient</span>
                <span className="border-l border-black/20 pl-4">CGST + SGST</span>
                <span className="border-l border-black/20 pl-4">{invoiceToPrint.jurisdiction} Jurisdiction</span>
              </div>
            </div>

            {/* Meta Boxes */}
            <div className="p-10 md:p-12 pb-6 space-y-8">
              <div className="grid grid-cols-2 gap-12">
                <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm bg-[#FDFBF7]">
                  <div className="bg-[#C9A84C] px-4 py-1.5">
                    <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">INVOICE DETAILS</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-y-3 text-[11px]">
                    <span className="font-bold text-[#6B5C42] uppercase">Invoice Number:</span>
                    <span className="font-black text-[#0C0A07]">{invoiceToPrint.inv_no}</span>
                    <span className="font-bold text-[#6B5C42] uppercase">Invoice Date:</span>
                    <span className="font-black text-[#0C0A07]">{new Date(invoiceToPrint.inv_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="font-bold text-[#6B5C42] uppercase">Payment Terms:</span>
                    <span className="font-black text-[#0C0A07]">{invoiceToPrint.payment_terms}</span>
                  </div>
                </div>

                <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm bg-[#FDFBF7]">
                  <div className="bg-[#C9A84C] px-4 py-1.5">
                    <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">BILL TO</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-lg font-black text-[#0C0A07] uppercase leading-tight mb-2">
                      {invoiceToPrint.b_name}
                    </p>
                    <p className="text-[11px] font-bold text-[#6B5C42] uppercase leading-relaxed">
                      {invoiceToPrint.b_addr1}<br />
                      {invoiceToPrint.b_city}, {invoiceToPrint.b_state} {invoiceToPrint.b_pin}<br />
                      {invoiceToPrint.b_gstin && `GSTIN: ${invoiceToPrint.b_gstin}`}<br />
                      {invoiceToPrint.b_po && `PO Ref: ${invoiceToPrint.b_po}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Band */}
              <div className="bg-[#181410] rounded-lg px-6 py-2.5 flex gap-4 items-center border-l-[6px] border-[#C9A84C]">
                <span className="text-[#DFC06A] text-[10px] font-black tracking-widest uppercase shrink-0">PROJECT:</span>
                <p className="text-xs font-bold text-[#F5EDD6] uppercase tracking-wide truncate">
                  {invoiceToPrint.project_desc || invoiceToPrint.project_ref || invoiceToPrint.inv_no}
                </p>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-lg border border-[#CEBB8A]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0C0A07] text-[#C9A84C]">
                    <tr>
                      <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest w-12 border-r border-white/10 text-center">#</th>
                      <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10">Description of Work / Materials</th>
                      <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">HSN/SAC</th>
                      <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">Qty</th>
                      <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right border-r border-white/10">Rate (Rs.)</th>
                      <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">GST %</th>
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
                        <td className="p-4 text-center text-xs font-black border-r border-[#F7F2E8]">{item.qty} {item.unit}</td>
                        <td className="p-4 text-right text-xs font-mono border-r border-[#F7F2E8]">{indianNumberFormat(item.rate)}</td>
                        <td className="p-4 text-center text-xs font-black border-r border-[#F7F2E8]">{item.gst}%</td>
                        <td className="p-4 text-right text-xs font-mono font-black">{indianNumberFormat(item.qty * item.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mt-6">
                <div className="w-96 space-y-2">
                  <div className="flex justify-between text-[11px] font-bold px-4">
                    <span className="text-[#6B5C42] uppercase tracking-widest">Subtotal (before GST)</span>
                    <span className="font-mono text-[#0C0A07]">Rs. {indianNumberFormat(totals.subtotal)}</span>
                  </div>
                  {totals.disc_amt > 0 && (
                    <div className="flex justify-between text-[11px] font-bold px-4 text-destructive">
                      <span className="uppercase tracking-widest">Discount ({invoiceToPrint.discount_percent}%)</span>
                      <span className="font-mono">- Rs. {indianNumberFormat(totals.disc_amt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] font-bold px-4">
                    <span className="text-[#6B5C42] uppercase tracking-widest">CGST (9%)</span>
                    <span className="font-mono text-[#0C0A07]">Rs. {indianNumberFormat(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold px-4">
                    <span className="text-[#6B5C42] uppercase tracking-widest">SGST (9%)</span>
                    <span className="font-mono text-[#0C0A07]">Rs. {indianNumberFormat(totals.sgst)}</span>
                  </div>
                  {totals.tds_amt > 0 && (
                    <div className="flex justify-between text-[11px] font-bold px-4 border-b border-[#E0D4B0] pb-3 text-destructive">
                      <span className="uppercase tracking-widest">TDS Deductible (Sec. 194C)</span>
                      <span className="font-mono">- Rs. {indianNumberFormat(totals.tds_amt)}</span>
                    </div>
                  )}
                  <div className="bg-[#0C0A07] p-5 rounded-lg text-[#C9A84C] flex justify-between items-center shadow-lg border-l-[8px] border-[#C9A84C]">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">TOTAL AMOUNT PAYABLE</p>
                      <p className="text-3xl font-black tracking-tighter leading-none text-[#DFC06A]">Rs. {indianNumberFormat(totals.final)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount In Words */}
              <div className="bg-[#F0E4B8] px-6 py-3 rounded-lg border border-[#CEBB8A] flex items-center gap-4">
                <span className="text-[10px] font-black text-[#6B5C42] uppercase tracking-widest">Amount In Words:</span>
                <p className="text-xs font-black text-[#0C0A07] uppercase italic">{numberToWords(totals.final)}</p>
              </div>

              {/* Bank + Signatory */}
              <div className="grid grid-cols-2 gap-12 pt-4">
                <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm bg-[#FDFBF7]">
                  <div className="bg-[#C9A84C] px-4 py-1.5">
                    <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">BANK DETAILS</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-y-2 text-[11px]">
                    <span className="font-bold text-[#6B5C42]">Bank:</span>
                    <span className="font-black text-[#0C0A07]">{invoiceToPrint.bk_name}</span>
                    <span className="font-bold text-[#6B5C42]">Account No.:</span>
                    <span className="font-black text-[#0C0A07] font-mono">{invoiceToPrint.bk_acno}</span>
                    <span className="font-bold text-[#6B5C42]">IFSC Code:</span>
                    <span className="font-black text-[#0C0A07] font-mono">{invoiceToPrint.bk_ifsc}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-end pb-4 space-y-4">
                  <div className="h-24 w-24 border-[3px] border-[#C9A84C]/40 rounded-full flex items-center justify-center opacity-40 -rotate-12">
                    <p className="text-[9px] font-black text-[#C9A84C] uppercase text-center leading-none">Verified<br/>Audit<br/>2026</p>
                  </div>
                  <div className="text-center">
                    <div className="h-[0.8px] w-56 bg-[#CEBB8A] mx-auto mb-2" />
                    <p className="text-[11px] font-black text-[#0C0A07] uppercase tracking-widest">Authorised Signatory</p>
                    <p className="text-[9px] font-bold text-[#6B5C42] uppercase">For {invoiceToPrint.s_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="bg-[#0C0A07] py-4 px-10 text-white flex justify-between items-center print:border-t-0 border-t border-white/10">
              <p className="text-[9px] font-black tracking-[0.2em] text-[#DFC06A]">
                NALAKATH CONSTRUCTIONS PVT. LTD.
              </p>
              <div className="flex gap-6 text-[8px] font-bold text-[#F5EDD6] uppercase tracking-widest">
                <span>Areecode, Malappuram</span>
                <span className="text-[#C9A84C]">Page 1 of 1</span>
              </div>
            </div>

            <div className="print:hidden flex gap-4 justify-end p-8 border-t border-zinc-100 bg-zinc-50 mt-10">
              <Button variant="outline" className="rounded-full px-8 h-14 font-black uppercase text-[11px] tracking-widest" onClick={() => setInvoiceToPrint(null)}>
                Discard Preview
              </Button>
              <Button className="rounded-full px-12 h-14 font-black uppercase text-[11px] tracking-widest bg-[#0C0A07] text-[#C9A84C] hover:bg-black shadow-2xl" onClick={() => window.print()}>
                <Printer className="h-5 w-5 mr-2" /> Save PDF / Print
              </Button>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
