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
  Download,
  Calendar,
  Hash,
  FileCode,
  Landmark,
  Receipt,
  Banknote,
  Stamp,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ScrollText,
  Settings2,
  Eye,
  Copy
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
  const year = new Date().getFullYear();
  const [invNo, setInvNo] = useState(searchParams.get("inv") || `NH/${year}/001`);
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [billToName, setBillToName] = useState(searchParams.get("client") || "");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToGstin, setBillToGstin] = useState("");
  const [billToPoRef, setBillToPoRef] = useState("");
  const [billToAttn, setBillToAttn] = useState("");
  const [projectDesc, setProjectDesc] = useState(searchParams.get("desc") || "");
  const [projectRef, setProjectRef] = useState("");
  
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
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
                <h1 className="text-3xl font-bold tracking-tight text-primary">Invoice Generator</h1>
                <p className="text-muted-foreground text-sm">Create tax invoices for Nalakath Holdings projects — matching registered fiscal format.</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowPreview(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Eye className="w-4 h-4 mr-2" /> GENERATE PROFESSIONAL PREVIEW
                </Button>
                {/* Load Invoice Button */}
                <Button
                  onClick={() => {
                    setInvNo("NH/2026/001");
                    setInvDate("2026-05-18");
                    setDueDate("2026-06-17");
                    setBillToName("Kerala State Construction Board");
                    setBillToAddress("Civil Station Road\nMalappuram, Kerala 676505");
                    setBillToGstin("32YYYYYY5678Z6");
                    setBillToPoRef("KSCB/PO/2025/0089");
                    setBillToAttn("Mr. Suresh Kumar, Project Manager");
                    setProjectDesc("Construction of Community Hall, Perinthalmanna, Malappuram");
                    setProjectRef("PROJ-2025-011");
                    setItems([
                      { id: Date.now() + 1, description: "Excavation & earthwork — foundation", hsn: "9954", qty: 450, unit: "Cu.m", rate: 185, gst: 18 },
                      { id: Date.now() + 2, description: "PCC M15 Grade concrete work", hsn: "9954", qty: 180, unit: "Cu.m", rate: 4200, gst: 18 },
                      { id: Date.now() + 3, description: "RCC M25 Grade — columns, beams & slabs", hsn: "9954", qty: 220, unit: "Cu.m", rate: 6800, gst: 18 },
                      { id: Date.now() + 4, description: "Brick masonry work (1:6 cement mortar)", hsn: "9954", qty: 380, unit: "Cu.m", rate: 3200, gst: 18 },
                      { id: Date.now() + 5, description: "Plastering — internal & external, 12mm", hsn: "9954", qty: 2800, unit: "Sq.m", rate: 185, gst: 18 },
                    ]);
                  }}
                  variant="outline"
                  className="rounded-full h-12 px-6 border-primary/20 text-primary font-bold"
                >
                  <Copy className="w-4 h-4 mr-2" /> LOAD SAMPLE
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ── LEFT COLUMN: DETAILS ── */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-primary/20 glass overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <FileText className="w-4 h-4" /> Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Invoice Number</Label>
                      <Input 
                        value={invNo} 
                        onChange={(e) => setInvNo(e.target.value)} 
                        className="bg-background/50 border-primary/20 focus:border-primary h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Invoice Date</Label>
                      <Input 
                        type="date" 
                        value={invDate} 
                        onChange={(e) => setInvDate(e.target.value)} 
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Due Date</Label>
                      <Input 
                        type="date" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)} 
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Project Reference</Label>
                      <Input 
                        placeholder="e.g. PROJ-2025-011"
                        value={projectRef} 
                        onChange={(e) => setProjectRef(e.target.value)} 
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Payment Terms</Label>
                      <Input 
                        value="Net 30 Days"
                        readOnly
                        className="bg-background/50 border-primary/20 h-11 opacity-60"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Project Description</Label>
                      <Input 
                        placeholder="e.g. Construction of Community Hall, Perinthalmanna"
                        value={projectDesc} 
                        onChange={(e) => setProjectDesc(e.target.value)} 
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 glass overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
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
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Attn / Contact Person</Label>
                      <Input 
                        placeholder="Attn: Mr. Name, Designation"
                        value={billToAttn} 
                        onChange={(e) => setBillToAttn(e.target.value)} 
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">GSTIN</Label>
                      <Input 
                        placeholder="Optional — 32XXXXXX1234Z5"
                        value={billToGstin} 
                        onChange={(e) => setBillToGstin(e.target.value)} 
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">PO Reference</Label>
                      <Input 
                        placeholder="Optional — PO Ref"
                        value={billToPoRef} 
                        onChange={(e) => setBillToPoRef(e.target.value)} 
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Full Address</Label>
                      <Input 
                        placeholder="Street, City, State, PIN"
                        value={billToAddress} 
                        onChange={(e) => setBillToAddress(e.target.value)} 
                        className="bg-background/50 border-primary/20 h-11"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 glass overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <PlusCircle className="w-4 h-4" /> Line Items
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={addItem} className="text-primary hover:text-primary/80">
                      <Plus className="w-4 h-4 mr-1" /> Add Item
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-primary/5 text-[10px] uppercase font-bold text-muted-foreground border-b border-primary/10">
                          <tr>
                            <th className="px-4 py-3 w-10">#</th>
                            <th className="px-4 py-3 min-w-[250px]">Description of Work / Materials</th>
                            <th className="px-4 py-3 w-20">HSN/SAC</th>
                            <th className="px-4 py-3 w-16">Qty</th>
                            <th className="px-4 py-3 w-20">Unit</th>
                            <th className="px-4 py-3 w-28">Rate (Rs.)</th>
                            <th className="px-4 py-3 w-16">GST%</th>
                            <th className="px-4 py-3 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                          {items.map((item, index) => (
                            <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                              <td className="px-4 py-2.5 text-xs text-muted-foreground font-bold text-center">{index + 1}</td>
                              <td className="px-4 py-2.5">
                                <Input 
                                  value={item.description} 
                                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm"
                                  placeholder="Enter item description..."
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <Input 
                                  value={item.hsn} 
                                  onChange={(e) => updateItem(item.id, "hsn", e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <Input 
                                  type="number"
                                  value={item.qty} 
                                  onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <Input 
                                  value={item.unit} 
                                  onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center"
                                  placeholder="Cu.m"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <Input 
                                  type="number"
                                  value={item.rate} 
                                  onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-right"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <Input 
                                  type="number"
                                  value={item.gst} 
                                  onChange={(e) => updateItem(item.id, "gst", Number(e.target.value))}
                                  className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-center">
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
                <Card className="border-primary/20 glass overflow-hidden sticky top-24">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <Settings2 className="w-4 h-4" /> Adjustments
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
                          className="bg-background/50 border-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">TDS % (194C)</Label>
                        <Input 
                          type="number" 
                          value={tdsPercent} 
                          onChange={(e) => setTdsPercent(Number(e.target.value))}
                          className="bg-background/50 border-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Jurisdiction</Label>
                      <Input 
                        value={jurisdiction} 
                        onChange={(e) => setJurisdiction(e.target.value)}
                        className="bg-background/50 border-primary/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">GST Type</Label>
                      <div className="flex bg-primary/10 p-1 rounded-lg">
                        <button 
                          onClick={() => setIsCgstSgst(true)}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${isCgstSgst ? "bg-primary text-primary-foreground" : "text-primary/60"}`}
                        >
                          LOCAL (CGST+SGST)
                        </button>
                        <button 
                          onClick={() => setIsCgstSgst(false)}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${!isCgstSgst ? "bg-primary text-primary-foreground" : "text-primary/60"}`}
                        >
                          IGST
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Extra Charges</Label>
                        <Input 
                          type="number" 
                          value={extraCharges} 
                          onChange={(e) => setExtraCharges(Number(e.target.value))}
                          className="bg-background/50 border-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Extra Label</Label>
                        <Input 
                          value={extraLabel} 
                          onChange={(e) => setExtraLabel(e.target.value)}
                          className="bg-background/50 border-primary/20"
                        />
                      </div>
                    </div>

                    <Separator className="bg-primary/20" />

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
                        <span>{isCgstSgst ? "CGST + SGST" : "IGST"}</span>
                        <span className="font-medium text-primary">Rs. {fmt(totals.totalGst)}</span>
                      </div>
                      {totals.tdsAmt > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                          <span>TDS Deductible ({tdsPercent}% Sec.194C)</span>
                          <span>- Rs. {fmt(totals.tdsAmt)}</span>
                        </div>
                      )}
                      {extraCharges > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{extraLabel}</span>
                          <span>Rs. {fmt(extraCharges)}</span>
                        </div>
                      )}
                      <Separator className="bg-primary/20" />
                      <div className="flex justify-between items-end pt-2">
                        <span className="text-lg font-bold uppercase tracking-tighter">Total Payable</span>
                        <span className="text-2xl font-black text-primary">Rs. {fmt(totals.final)}</span>
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
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 glass p-4 rounded-full border border-primary/30 shadow-2xl z-50 print:hidden">
              <Button 
                variant="ghost" 
                onClick={() => setShowPreview(false)}
                className="rounded-full h-12 px-6 font-bold hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> BACK TO EDITOR
              </Button>
              <Button 
                onClick={handlePrint}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 rounded-full shadow-lg shadow-primary/30"
              >
                <Printer className="w-4 h-4 mr-2" /> EXPORT TO PDF
              </Button>
            </div>

            {/* ── THE A4 DOCUMENT ── */}
            <div id="invoice-document" className="w-full max-w-[210mm] bg-white text-black shadow-2xl p-0 font-sans relative overflow-hidden flex flex-col">
              
              {/* ── HEADER SECTION ── */}
              <div className="bg-zinc-950 p-8 pb-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-zinc-950" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-white leading-none">NALAKATH HOLDINGS</h1>
                        <p className="text-[9px] text-primary/70 uppercase tracking-[0.2em] mt-1.5 font-bold">Building Trust. Building Kerala.</p>
                      </div>
                    </div>
                    <div className="text-[8px] text-zinc-500 leading-relaxed space-y-0.5">
                      <p>Nalakath Hub, Ward No. 4, Areecode, Malappuram, Kerala 673639</p>
                      <p>+91 97444 00100 &nbsp;|&nbsp; info@nalakathindia.com &nbsp;|&nbsp; GSTIN: 32XXXXXX1234Z5</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[7px] text-primary font-bold uppercase tracking-widest opacity-50">Corporate Identification</p>
                    <p className="text-[8px] text-zinc-500 font-mono">GSTIN: 32XXXXXX1234Z5</p>
                    <p className="text-[8px] text-zinc-500 font-mono">CIN: U45200KL2013PTC034078</p>
                  </div>
                </div>
              </div>

              {/* ── TITLE BAND ── */}
              <div className="bg-primary px-8 py-3 flex justify-between items-center">
                <h2 className="text-lg font-black tracking-widest text-zinc-950 uppercase">Tax Invoice</h2>
                <div className="text-[8px] font-bold text-zinc-950/70 flex gap-3 uppercase tracking-wider">
                  <span>Original for Recipient</span>
                  <span>|</span>
                  <span>{isCgstSgst ? "CGST + SGST (Local)" : "IGST (Inter-state)"}</span>
                  <span>|</span>
                  <span>{jurisdiction} Jurisdiction</span>
                </div>
              </div>

              {/* ── INVOICE META & BILL TO ── */}
              <div className="grid grid-cols-2 gap-6 px-8 pt-6 pb-4">
                {/* Left: Invoice Details */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Invoice Details</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500 font-medium">Invoice Number:</span>
                      <span className="font-bold text-zinc-900">{invNo}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500 font-medium">Invoice Date:</span>
                      <span className="font-bold text-zinc-900">{formatDate(invDate)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500 font-medium">Due Date:</span>
                      <span className="font-bold text-zinc-900">{formatDate(dueDate)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500 font-medium">Payment Terms:</span>
                      <span className="font-bold text-zinc-900">Net 30 Days</span>
                    </div>
                    {projectRef && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500 font-medium">Project Ref:</span>
                        <span className="font-bold text-zinc-900 font-mono">{projectRef}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Bill To */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Bill To</span>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <p className="text-[12px] font-black text-zinc-900 uppercase leading-tight">{billToName || "____________________"}</p>
                    {billToAttn && <p className="text-[9px] text-zinc-500">Attn: {billToAttn}</p>}
                    <p className="text-[9px] text-zinc-600 whitespace-pre-line leading-snug">{billToAddress || "____________________"}</p>
                    {billToGstin && <p className="text-[9px] font-bold text-zinc-500 font-mono mt-1">GSTIN: {billToGstin}</p>}
                    {billToPoRef && <p className="text-[9px] font-bold text-zinc-500 font-mono">PO Ref: {billToPoRef}</p>}
                  </div>
                </div>
              </div>

              {/* ── PROJECT BAR ── */}
              {projectDesc && (
                <div className="mx-8 bg-zinc-950 py-2.5 px-5 rounded-lg flex items-center gap-3 border border-zinc-800">
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest">Project:</span>
                  <span className="text-[10px] text-zinc-300 font-bold">{projectDesc}</span>
                </div>
              )}

              {/* ── ITEMS TABLE ── */}
              <div className="flex-grow px-8 pt-4 pb-2">
                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-950 text-white text-[9px] uppercase font-black tracking-wider">
                        <th className="px-3 py-3 w-10 text-center text-primary">#</th>
                        <th className="px-3 py-3">Description of Work / Materials</th>
                        <th className="px-3 py-3 w-20 text-center">HSN/SAC</th>
                        <th className="px-3 py-3 w-14 text-center">Qty</th>
                        <th className="px-3 py-3 w-18 text-center">Unit</th>
                        <th className="px-3 py-3 w-28 text-right">Rate (Rs.)</th>
                        <th className="px-3 py-3 w-14 text-center">GST %</th>
                        <th className="px-3 py-3 w-32 text-right text-primary">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="text-[10px] hover:bg-zinc-50 transition-colors">
                          <td className="px-3 py-3 text-center text-zinc-400 font-bold">{idx + 1}</td>
                          <td className="px-3 py-3 font-bold text-zinc-800">{item.description}</td>
                          <td className="px-3 py-3 text-center text-zinc-500 font-mono">{item.hsn}</td>
                          <td className="px-3 py-3 text-center font-black">{item.qty}</td>
                          <td className="px-3 py-3 text-center text-zinc-500 font-medium">{item.unit}</td>
                          <td className="px-3 py-3 text-right font-medium">{fmt(item.rate)}</td>
                          <td className="px-3 py-3 text-center text-zinc-500">{item.gst}%</td>
                          <td className="px-3 py-3 text-right font-black text-zinc-900">{fmt(item.qty * item.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── BOTTOM SECTION: TOTALS + BANK + TERMS ── */}
              <div className="px-8 py-4 grid grid-cols-12 gap-6">
                {/* Left Column: Amount in Words + Bank Details + Declaration */}
                <div className="col-span-6 space-y-4">
                  {/* Amount in Words */}
                  <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100/80">
                    <div className="flex items-start gap-3">
                      <ScrollText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[7px] font-black uppercase text-amber-800/60 tracking-widest">Amount in Words:</span>
                        <p className="text-[9px] font-bold italic text-zinc-800 leading-snug mt-0.5">{toWords(totals.final)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                      <Landmark className="w-3 h-3 text-zinc-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Bank Details</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {[
                        ["Bank:", "State Bank of India, Perinthalmanna"],
                        ["Account Name:", "NALAKATH HOLDINGS"],
                        ["Account No.:", "32XXXXXXXXXX51"],
                        ["IFSC Code:", "SBIN0001234"],
                        ["Account Type:", "Current Account"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-[8px] items-center">
                          <span className="text-zinc-500 uppercase font-bold tracking-wider">{label}</span>
                          <span className="font-black text-zinc-900 font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Declaration */}
                  <div className="flex items-start gap-2 text-[7px] text-zinc-400 italic leading-relaxed px-1">
                    <div className="w-1 h-1 bg-zinc-300 rounded-full mt-1.5 shrink-0" />
                    <p>We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct to the best of our knowledge.</p>
                  </div>
                </div>

                {/* Right Column: Totals + Signature */}
                <div className="col-span-6 space-y-3">
                  {/* Tax Breakdown */}
                  <div className="space-y-1.5 bg-zinc-50/80 p-4 rounded-xl border border-zinc-100">
                    <div className="flex justify-between text-[10px] items-center py-1">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Subtotal (before GST)</span>
                      <span className="font-black text-zinc-900">Rs. {fmt(totals.subtotal)}</span>
                    </div>
                    {totals.discAmt > 0 && (
                      <div className="flex justify-between text-[10px] items-center py-1 text-red-600 border-t border-zinc-100">
                        <span className="font-bold uppercase tracking-wider text-[9px]">Discount ({discountPercent}%)</span>
                        <span className="font-black">- Rs. {fmt(totals.discAmt)}</span>
                      </div>
                    )}
                    {isCgstSgst ? (
                      <>
                        <div className="flex justify-between text-[10px] items-center py-1 border-t border-zinc-100">
                          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">CGST ({(items[0]?.gst ?? 18) / 2}%)</span>
                          <span className="font-black text-zinc-900">Rs. {fmt(totals.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] items-center py-1">
                          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">SGST ({(items[0]?.gst ?? 18) / 2}%)</span>
                          <span className="font-black text-zinc-900">Rs. {fmt(totals.sgst)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-[10px] items-center py-1 border-t border-zinc-100">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">IGST</span>
                        <span className="font-black text-zinc-900">Rs. {fmt(totals.igst)}</span>
                      </div>
                    )}
                    {extraCharges > 0 && (
                      <div className="flex justify-between text-[10px] items-center py-1 border-t border-zinc-100">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">{extraLabel}</span>
                        <span className="font-black text-zinc-900">Rs. {fmt(extraCharges)}</span>
                      </div>
                    )}
                    {totals.tdsAmt > 0 && (
                      <div className="flex justify-between text-[10px] items-center py-1 text-red-600 border-t border-zinc-100">
                        <span className="font-bold uppercase tracking-wider text-[9px]">TDS Deductible ({tdsPercent}% Sec. 194C)</span>
                        <span className="font-black">- Rs. {fmt(totals.tdsAmt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Amount */}
                  <div className="bg-zinc-950 rounded-2xl p-5 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 blur-xl" />
                    <div className="relative flex flex-col items-center">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60 mb-1">Total Amount Payable</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-white/50">Rs.</span>
                        <span className="text-4xl font-black tracking-tighter text-primary drop-shadow-[0_0_12px_rgba(201,168,76,0.3)]">{fmt(totals.final)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signature + Stamp */}
                  <div className="flex justify-between items-end pt-2">
                    {/* Terms */}
                    <div className="text-[7px] text-zinc-400 space-y-0.5 leading-relaxed max-w-[140px]">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider mb-1">Terms & Conditions</p>
                      <p>1. Payment due within 30 days.</p>
                      <p>2. Interest @ 18% p.a. on overdue.</p>
                      <p>3. Disputes: Malappuram jurisdiction.</p>
                      <p>4. This is computer-generated.</p>
                    </div>
                    {/* Signature */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 border-2 border-zinc-200 rounded-full flex items-center justify-center relative opacity-40 mb-1">
                        <div className="absolute inset-1.5 border border-zinc-200 rounded-full border-dashed" />
                        <div className="text-[5px] font-black text-zinc-400 text-center uppercase leading-tight">
                          Nalakath<br />Holdings<br />Malappuram
                        </div>
                      </div>
                      <div className="w-32 h-px bg-zinc-900 mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900">Authorised Signatory</p>
                      <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-wider">For Nalakath Holdings</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── FOOTER ── */}
              <div className="mt-auto bg-zinc-950 py-3 px-8 flex justify-between items-center border-t-2 border-primary">
                <div className="flex gap-3 items-center flex-wrap">
                  <span className="text-[7px] font-black text-white/80 uppercase tracking-wider">NALAKATH HOLDINGS</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[7px] font-bold text-white/40">Nalakath Hub, Areecode, Malappuram</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[7px] font-bold text-white/40">+91 97444 00100</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[7px] font-bold text-white/40">nalakathindia.com</span>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-[7px] font-black text-primary/60 uppercase">GSTIN: 32XXXXXX1234Z5</span>
                  <span className="w-0.5 h-0.5 bg-primary/20 rounded-full" />
                  <span className="text-[7px] font-black text-primary/60 uppercase">Page 1 of 1</span>
                </div>
              </div>

              {/* ── WATERMARK ── */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.015] rotate-[-30deg]">
                <Building2 className="w-64 h-64 text-zinc-900" />
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
            min-height: 297mm;
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen font-black text-primary animate-pulse uppercase tracking-[0.5em]">Loading Invoice Engine...</div>}>
      <GeneratorContent />
    </Suspense>
  );
}
