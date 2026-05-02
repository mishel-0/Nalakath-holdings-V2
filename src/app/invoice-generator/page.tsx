"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  ArrowLeft, 
  Building2, 
  User, 
  MapPin, 
  CreditCard,
  Percent,
  PlusCircle,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  fmt, 
  toWords, 
  calculateInvoiceTotals 
} from "@/lib/invoice-utils";
import { motion, AnimatePresence } from "framer-motion";

function GeneratorContent() {
  const searchParams = useSearchParams();
  
  // ── STATE ──────────────────────────────────────────────────
  const [invNo, setInvNo] = useState(searchParams.get("inv") || `NH/${new Date().getFullYear()}/001`);
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [billToName, setBillToName] = useState(searchParams.get("client") || "");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToGstin, setBillToGstin] = useState("");
  const [projectDesc, setProjectDesc] = useState(searchParams.get("desc") || "");
  
  const [items, setItems] = useState([
    { id: Date.now(), description: "Site Mobilization & Preliminary Work", hsn: "9954", qty: 1, unit: "L.S.", rate: searchParams.get("amount") ? Number(searchParams.get("amount")) : 0, gst: 18 }
  ]);
  
  const [discountPercent, setDiscountPercent] = useState(0);
  const [tdsPercent, setTdsPercent] = useState(2);
  const [isCgstSgst, setIsCgstSgst] = useState(true);
  const [extraCharges, setExtraCharges] = useState(0);
  const [extraLabel, setExtraLabel] = useState("Extra Charges");
  const [jurisdiction, setJurisdiction] = useState("Malappuram");
  const [notes, setNotes] = useState("");

  const [showPreview, setShowPreview] = useState(false);

  // ── CALCULATIONS ───────────────────────────────────────────
  const totals = calculateInvoiceTotals(items, discountPercent, tdsPercent, isCgstSgst, extraCharges);

  // ── ACTIONS ────────────────────────────────────────────────
  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", hsn: "9954", qty: 1, unit: "Cu.m", rate: 0, gst: 18 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl min-h-screen">
      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gold-500">Invoice Generator</h1>
                <p className="text-muted-foreground">Create professional tax invoices for Nalakath Holdings projects.</p>
              </div>
              <Button 
                onClick={() => setShowPreview(true)}
                className="bg-gold-500 hover:bg-gold-600 text-black font-bold px-8 h-12 rounded-full shadow-lg shadow-gold-500/20 transition-all hover:scale-105 active:scale-95"
              >
                GENERATE PROFESSIONAL PREVIEW
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ── LEFT COLUMN: DETAILS ── */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-gold-500/20 glass overflow-hidden">
                  <CardHeader className="bg-gold-500/5 border-b border-gold-500/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-gold-400">
                      <FileText className="w-4 h-4" /> Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Invoice Number</Label>
                      <Input 
                        value={invNo} 
                        onChange={(e) => setInvNo(e.target.value)} 
                        className="bg-background/50 border-gold-500/20 focus:border-gold-500 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Date</Label>
                      <Input 
                        type="date" 
                        value={invDate} 
                        onChange={(e) => setInvDate(e.target.value)} 
                        className="bg-background/50 border-gold-500/20 h-11"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Project Description</Label>
                      <Input 
                        placeholder="e.g. Interior Works for Oval Palace Resort"
                        value={projectDesc} 
                        onChange={(e) => setProjectDesc(e.target.value)} 
                        className="bg-background/50 border-gold-500/20 h-11"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold-500/20 glass overflow-hidden">
                  <CardHeader className="bg-gold-500/5 border-b border-gold-500/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-gold-400">
                      <User className="w-4 h-4" /> Bill To (Recipient)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Client Name</Label>
                      <Input 
                        placeholder="Organization or Individual"
                        value={billToName} 
                        onChange={(e) => setBillToName(e.target.value)} 
                        className="bg-background/50 border-gold-500/20 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">GSTIN</Label>
                      <Input 
                        placeholder="Optional"
                        value={billToGstin} 
                        onChange={(e) => setBillToGstin(e.target.value)} 
                        className="bg-background/50 border-gold-500/20 h-11"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Full Address</Label>
                      <Input 
                        placeholder="Street, City, State, PIN"
                        value={billToAddress} 
                        onChange={(e) => setBillToAddress(e.target.value)} 
                        className="bg-background/50 border-gold-500/20 h-11"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold-500/20 glass overflow-hidden">
                  <CardHeader className="bg-gold-500/5 border-b border-gold-500/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-gold-400">
                      <PlusCircle className="w-4 h-4" /> Line Items
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={addItem} className="text-gold-500 hover:text-gold-400">
                      <Plus className="w-4 h-4 mr-1" /> Add Item
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gold-500/5 text-[10px] uppercase font-bold text-muted-foreground border-b border-gold-500/10">
                          <tr>
                            <th className="px-4 py-3 w-12">#</th>
                            <th className="px-4 py-3 min-w-[250px]">Description</th>
                            <th className="px-4 py-3 w-24">HSN</th>
                            <th className="px-4 py-3 w-20">Qty</th>
                            <th className="px-4 py-3 w-32">Rate</th>
                            <th className="px-4 py-3 w-20">GST%</th>
                            <th className="px-4 py-3 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-500/10">
                          {items.map((item, index) => (
                            <tr key={item.id} className="group">
                              <td className="px-4 py-3 text-xs text-muted-foreground">{index + 1}</td>
                              <td className="px-4 py-3">
                                <Input 
                                  value={item.description} 
                                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm"
                                  placeholder="Enter item description..."
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input 
                                  value={item.hsn} 
                                  onChange={(e) => updateItem(item.id, "hsn", e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input 
                                  type="number"
                                  value={item.qty} 
                                  onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input 
                                  type="number"
                                  value={item.rate} 
                                  onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input 
                                  type="number"
                                  value={item.gst} 
                                  onChange={(e) => updateItem(item.id, "gst", Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeItem(item.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── RIGHT COLUMN: SETTINGS & TOTALS ── */}
              <div className="space-y-8">
                <Card className="border-gold-500/20 glass overflow-hidden sticky top-24">
                  <CardHeader className="bg-gold-500/5 border-b border-gold-500/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-gold-400">
                      <Percent className="w-4 h-4" /> Adjustments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Discount %</Label>
                        <Input 
                          type="number" 
                          value={discountPercent} 
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="bg-background/50 border-gold-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">TDS % (194C)</Label>
                        <Input 
                          type="number" 
                          value={tdsPercent} 
                          onChange={(e) => setTdsPercent(Number(e.target.value))}
                          className="bg-background/50 border-gold-500/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">GST Type</Label>
                      <div className="flex bg-gold-500/10 p-1 rounded-lg">
                        <button 
                          onClick={() => setIsCgstSgst(true)}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${isCgstSgst ? "bg-gold-500 text-black" : "text-gold-500/60"}`}
                        >
                          LOCAL (CGST+SGST)
                        </button>
                        <button 
                          onClick={() => setIsCgstSgst(false)}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${!isCgstSgst ? "bg-gold-500 text-black" : "text-gold-500/60"}`}
                        >
                          IGST
                        </button>
                      </div>
                    </div>

                    <Separator className="bg-gold-500/20" />

                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">Rs. {fmt(totals.subtotal)}</span>
                      </div>
                      {totals.discAmt > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                          <span>Discount ({discountPercent}%)</span>
                          <span>- Rs. {fmt(totals.discAmt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>GST Total</span>
                        <span className="font-medium text-gold-400">Rs. {fmt(totals.totalGst)}</span>
                      </div>
                      {totals.tdsAmt > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                          <span>TDS Deductible ({tdsPercent}%)</span>
                          <span>- Rs. {fmt(totals.tdsAmt)}</span>
                        </div>
                      )}
                      <Separator className="bg-gold-500/20" />
                      <div className="flex justify-between items-end pt-2">
                        <span className="text-lg font-bold uppercase tracking-tighter">Total Payable</span>
                        <span className="text-2xl font-black text-gold-500">Rs. {fmt(totals.final)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-8 py-8"
          >
            {/* ── PREVIEW CONTROLS ── */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 glass p-4 rounded-full border border-gold-500/30 shadow-2xl z-50 print:hidden">
              <Button 
                variant="ghost" 
                onClick={() => setShowPreview(false)}
                className="rounded-full h-12 px-6 font-bold hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> DISCARD PREVIEW
              </Button>
              <Button 
                onClick={handlePrint}
                className="bg-gold-500 hover:bg-gold-600 text-black font-bold h-12 px-8 rounded-full shadow-lg shadow-gold-500/30"
              >
                <Printer className="w-4 h-4 mr-2" /> EXPORT TO PDF
              </Button>
            </div>

            {/* ── THE A4 DOCUMENT ── */}
            <div id="invoice-document" className="w-full max-w-[210mm] bg-white text-black shadow-2xl p-0 font-sans aspect-[1/1.414] relative overflow-hidden flex flex-col">
              
              {/* Gold Top Bar */}
              <div className="h-1 bg-gold-500 w-full" />

              {/* Header Section */}
              <div className="bg-zinc-950 p-10 flex justify-between items-end border-b-2 border-gold-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center p-3">
                      <Building2 className="w-full h-full text-zinc-950" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tighter text-gold-500 leading-none">NALAKATH HOLDINGS</h2>
                      <p className="text-[10px] text-gold-500/60 uppercase tracking-[0.2em] mt-1 font-bold italic">Building Trust. Building Kerala.</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-400 max-w-[300px] leading-relaxed">
                      Nalakath Hub, Ward No. 4, Areecode, Malappuram, Kerala 673639
                    </p>
                    <p className="text-[9px] text-zinc-400">+91 97444 00100 | info@nalakathindia.com</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[9px] text-gold-500 font-bold uppercase tracking-widest opacity-60">Corporate Identification</p>
                  <p className="text-[9px] text-zinc-300 font-mono">GSTIN: 32XXXXXX1234Z5</p>
                  <p className="text-[9px] text-zinc-300 font-mono">CIN: U45200KL2013PTC034078</p>
                </div>
              </div>

              {/* Title Band */}
              <div className="bg-gold-500 px-10 py-3 flex justify-between items-center">
                <h3 className="text-lg font-black tracking-widest text-zinc-950 uppercase">Tax Invoice</h3>
                <div className="text-[9px] font-bold text-zinc-950/70 flex gap-4 uppercase tracking-wider">
                  <span>Original for Recipient</span>
                  <span>|</span>
                  <span>{isCgstSgst ? "CGST + SGST (Local)" : "IGST (Inter-state)"}</span>
                  <span>|</span>
                  <span>{jurisdiction} Jurisdiction</span>
                </div>
              </div>

              {/* Meta Boxes */}
              <div className="grid grid-cols-2 gap-8 px-10 py-8">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden">
                  <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Invoice Details</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500 font-medium">Invoice Number:</span>
                      <span className="font-bold">{invNo}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500 font-medium">Invoice Date:</span>
                      <span className="font-bold">{new Date(invDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500 font-medium">Payment Terms:</span>
                      <span className="font-bold text-zinc-950">Net 30 Days</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden">
                  <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bill To</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-[13px] font-black text-zinc-950 uppercase leading-none">{billToName}</p>
                    <p className="text-[11px] text-zinc-600 leading-tight pr-4">{billToAddress}</p>
                    {billToGstin && <p className="text-[11px] font-bold text-zinc-500 mt-2 font-mono">GSTIN: {billToGstin}</p>}
                  </div>
                </div>
              </div>

              {/* Project Bar */}
              <div className="mx-10 bg-zinc-950 p-3 px-6 rounded-xl flex items-center gap-4 border border-zinc-800">
                <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest">Project:</span>
                <span className="text-[11px] text-zinc-300 font-bold tracking-wide">{projectDesc || "General Consultation / Civil Works"}</span>
              </div>

              {/* Items Table */}
              <div className="flex-grow px-10 py-6">
                <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-white">
                      <tr className="text-[10px] uppercase font-black tracking-widest">
                        <th className="px-4 py-4 w-12 text-center text-gold-500">#</th>
                        <th className="px-4 py-4">Description of Work / Materials</th>
                        <th className="px-4 py-4 w-24 text-center">HSN/SAC</th>
                        <th className="px-4 py-4 w-16 text-center">Qty</th>
                        <th className="px-4 py-4 w-20 text-center">Unit</th>
                        <th className="px-4 py-4 w-28 text-right">Rate (Rs.)</th>
                        <th className="px-4 py-4 w-16 text-center">GST %</th>
                        <th className="px-4 py-4 w-32 text-right text-gold-500">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="text-[11px]">
                          <td className="px-4 py-4 text-center text-zinc-400 font-bold">{idx + 1}</td>
                          <td className="px-4 py-4 font-bold text-zinc-800">{item.description}</td>
                          <td className="px-4 py-4 text-center text-zinc-500 font-mono">{item.hsn}</td>
                          <td className="px-4 py-4 text-center font-black">{item.qty}</td>
                          <td className="px-4 py-4 text-center text-zinc-500 font-medium">{item.unit}</td>
                          <td className="px-4 py-4 text-right font-medium">{fmt(item.rate)}</td>
                          <td className="px-4 py-4 text-center text-zinc-500">{item.gst}%</td>
                          <td className="px-4 py-4 text-right font-black text-zinc-900">{fmt(item.qty * item.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Section: Totals & Bank */}
              <div className="px-10 py-8 grid grid-cols-12 gap-8 items-start">
                {/* Words */}
                <div className="col-span-12">
                  <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase text-amber-900 tracking-widest whitespace-nowrap opacity-60">Amount in Words:</span>
                    <span className="text-[11px] font-black italic text-zinc-900 leading-none underline decoration-amber-300 underline-offset-4">{toWords(totals.final)}</span>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="col-span-6 space-y-6">
                  <div className="rounded-3xl border border-zinc-200 overflow-hidden">
                    <div className="bg-zinc-100 px-6 py-2 border-b border-zinc-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bank Details</span>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="grid grid-cols-2 text-[10px] items-center">
                        <span className="text-zinc-500 uppercase font-bold tracking-widest">Bank:</span>
                        <span className="font-black text-zinc-900">STATE BANK OF INDIA, PERINTHALMANNA</span>
                      </div>
                      <div className="grid grid-cols-2 text-[10px] items-center">
                        <span className="text-zinc-500 uppercase font-bold tracking-widest">Account Name:</span>
                        <span className="font-black text-zinc-900">NALAKATH HOLDINGS</span>
                      </div>
                      <div className="grid grid-cols-2 text-[10px] items-center">
                        <span className="text-zinc-500 uppercase font-bold tracking-widest">Account No.:</span>
                        <span className="font-black text-zinc-900 font-mono tracking-tighter">32XXXXXXXXXX51</span>
                      </div>
                      <div className="grid grid-cols-2 text-[10px] items-center">
                        <span className="text-zinc-500 uppercase font-bold tracking-widest">IFSC Code:</span>
                        <span className="font-black text-zinc-900 font-mono">SBIN0001234</span>
                      </div>
                      <div className="grid grid-cols-2 text-[10px] items-center">
                        <span className="text-zinc-500 uppercase font-bold tracking-widest">Type:</span>
                        <span className="font-black text-zinc-900 uppercase">Current Account</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[8px] text-zinc-400 italic flex gap-4 items-start leading-relaxed">
                      <div className="w-1 h-1 bg-zinc-300 rounded-full mt-1 shrink-0" />
                      <p>We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct to the best of our knowledge.</p>
                    </div>
                  </div>
                </div>

                {/* Totals Section */}
                <div className="col-span-6 space-y-4">
                  <div className="space-y-3 pr-4">
                    <div className="flex justify-between text-[11px] items-center">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">Subtotal (before GST)</span>
                      <span className="font-black text-zinc-900">Rs. {fmt(totals.subtotal)}</span>
                    </div>
                    {totals.discAmt > 0 && (
                      <div className="flex justify-between text-[11px] items-center text-red-600">
                        <span className="font-bold uppercase tracking-widest">Discount ({discountPercent}%)</span>
                        <span className="font-black">- Rs. {fmt(totals.discAmt)}</span>
                      </div>
                    )}
                    {isCgstSgst ? (
                      <>
                        <div className="flex justify-between text-[11px] items-center">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest">CGST</span>
                          <span className="font-black text-zinc-900">Rs. {fmt(totals.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] items-center border-b border-zinc-100 pb-2">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest">SGST</span>
                          <span className="font-black text-zinc-900">Rs. {fmt(totals.sgst)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-[11px] items-center border-b border-zinc-100 pb-2">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest">IGST</span>
                        <span className="font-black text-zinc-900">Rs. {fmt(totals.igst)}</span>
                      </div>
                    )}
                    {extraCharges > 0 && (
                      <div className="flex justify-between text-[11px] items-center">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest">{extraLabel}</span>
                        <span className="font-black text-zinc-900">Rs. {fmt(extraCharges)}</span>
                      </div>
                    )}
                    {totals.tdsAmt > 0 && (
                      <div className="flex justify-between text-[11px] items-center text-red-600">
                        <span className="font-bold uppercase tracking-widest">TDS Deductible ({tdsPercent}%)</span>
                        <span className="font-black">- Rs. {fmt(totals.tdsAmt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-950 rounded-[40px] p-8 text-white relative shadow-xl overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-gold-500/20 transition-all duration-700" />
                    <div className="relative flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-500/60 mb-1">Total Amount Payable</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black tracking-tighter text-white/50">Rs.</span>
                        <span className="text-5xl font-black tracking-tighter text-gold-500 drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">{fmt(totals.final)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="pt-8 flex flex-col items-center text-center">
                    <div className="w-24 h-24 border-2 border-zinc-100 rounded-full flex items-center justify-center p-4 relative opacity-40">
                      <div className="absolute inset-2 border border-zinc-200 rounded-full border-dashed" />
                      <div className="text-[6px] font-black text-zinc-400 text-center uppercase leading-tight">
                        Nalakath<br />Holdings<br />Malappuram
                      </div>
                    </div>
                    <div className="w-48 h-px bg-zinc-950 mt-4 mb-2" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-950">Authorised Signatory</p>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">For Nalakath Holdings</p>
                  </div>
                </div>
              </div>

              {/* Footer Band */}
              <div className="mt-auto bg-zinc-950 p-6 flex justify-between items-center border-t-2 border-gold-500">
                <div className="flex gap-4 items-center">
                  <p className="text-[8px] font-black text-white/80 uppercase tracking-widest">NALAKATH HOLDINGS</p>
                  <span className="w-1 h-1 bg-gold-500/50 rounded-full" />
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Nalakath Hub, Areecode, Malappuram</p>
                  <span className="w-1 h-1 bg-gold-500/50 rounded-full" />
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">+91 97444 00100</p>
                  <span className="w-1 h-1 bg-gold-500/50 rounded-full" />
                  <p className="text-[8px] font-bold text-white/40 tracking-widest uppercase">nalakathindia.com</p>
                </div>
                <div className="flex gap-4 items-center">
                  <p className="text-[8px] font-black text-gold-500/80 uppercase tracking-widest">GSTIN: 32XXXXXX1234Z5</p>
                  <span className="w-1 h-1 bg-gold-500/20 rounded-full" />
                  <p className="text-[8px] font-black text-gold-500/80 uppercase tracking-widest">CIN: U45200KL2013PTC034078</p>
                  <span className="w-1 h-1 bg-gold-500/20 rounded-full" />
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Page 1 of 1</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-document, #invoice-document * {
            visibility: visible;
          }
          #invoice-document {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            box-shadow: none;
          }
          .glass {
            background: none !important;
            backdrop-filter: none !important;
            border: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoiceGeneratorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen font-black text-gold-500 animate-pulse uppercase tracking-[0.5em]">Loading Invoice Engine...</div>}>
      <GeneratorContent />
    </Suspense>
  );
}
