"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FileText, Plus, Trash2, Printer, ArrowLeft, Building2, User,
  Percent, PlusCircle, Landmark, ScrollText, Eye, Copy, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { fmt, toWords, calculateInvoiceTotals } from "@/lib/invoice-utils";
import { motion, AnimatePresence } from "framer-motion";

function GeneratorContent() {
  const searchParams = useSearchParams();
  const year = new Date().getFullYear();

  // ── STATE ──
  const [invNo, setInvNo] = useState(searchParams.get("inv") || `NH/${year}/001`);
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
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
  const [showPreview, setShowPreview] = useState(false);

  const totals = calculateInvoiceTotals(items, discountPercent, tdsPercent, isCgstSgst, extraCharges);

  const addItem = () => setItems([...items, { id: Date.now(), description: "", hsn: "9954", qty: 1, unit: "Cu.m", rate: 0, gst: 18 }]);
  const removeItem = (id: number) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };
  const updateItem = (id: number, field: string, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  const handlePrint = () => window.print();

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : "";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl min-h-screen">
      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Invoice Generator</h1>
                <p className="text-muted-foreground text-sm">Create invoices for Nalakath Holdings projects.</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => {
                  setInvNo("NH/2026/001"); setInvDate("2026-05-18"); setDueDate("2026-06-17");
                  setBillToName("Kerala State Construction Board");
                  setBillToAddress("Civil Station Road\nMalappuram, Kerala 676505");
                  setBillToGstin("32YYYYYY5678Z6"); setBillToPoRef("KSCB/PO/2025/0089");
                  setBillToAttn("Mr. Suresh Kumar, Project Manager");
                  setProjectDesc("Construction of Community Hall, Perinthalmanna, Malappuram");
                  setProjectRef("PROJ-2025-011");
                  setItems([
                    { id: Date.now()+1, description: "Excavation & earthwork — foundation", hsn: "9954", qty: 450, unit: "Cu.m", rate: 185, gst: 18 },
                    { id: Date.now()+2, description: "PCC M15 Grade concrete work", hsn: "9954", qty: 180, unit: "Cu.m", rate: 4200, gst: 18 },
                    { id: Date.now()+3, description: "RCC M25 Grade — columns, beams & slabs", hsn: "9954", qty: 220, unit: "Cu.m", rate: 6800, gst: 18 },
                    { id: Date.now()+4, description: "Brick masonry work (1:6 cement mortar)", hsn: "9954", qty: 380, unit: "Cu.m", rate: 3200, gst: 18 },
                    { id: Date.now()+5, description: "Plastering — internal & external, 12mm", hsn: "9954", qty: 2800, unit: "Sq.m", rate: 185, gst: 18 },
                  ]);
                }} variant="outline" className="rounded-full h-12 px-6 border-primary/20 text-primary font-bold">
                  <Copy className="w-4 h-4 mr-2" /> LOAD SAMPLE
                </Button>
                <Button onClick={() => setShowPreview(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  <Eye className="w-4 h-4 mr-2" /> GENERATE PREVIEW
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ── LEFT COLUMN ── */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-primary/20 glass">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <FileText className="w-4 h-4" /> Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Invoice Number" value={invNo} onChange={setInvNo} />
                    <Field label="Invoice Date" type="date" value={invDate} onChange={setInvDate} />
                    <Field label="Due Date" type="date" value={dueDate} onChange={setDueDate} />
                    <Field label="Project Reference" placeholder="PROJ-2025-011" value={projectRef} onChange={setProjectRef} />
                    <Field label="Payment Terms" value="Net 30 Days" readOnly />
                    <Field label="Jurisdiction" value={jurisdiction} onChange={setJurisdiction} />
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Project Description</Label>
                      <Input placeholder="Construction of Community Hall, Perinthalmanna" value={projectDesc} onChange={e => setProjectDesc(e.target.value)} className="bg-background/50 border-primary/20 h-11" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 glass">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <User className="w-4 h-4" /> Bill To (Recipient)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Client / Organization" placeholder="Organization or Individual" value={billToName} onChange={setBillToName} />
                    <Field label="Attn / Contact" placeholder="Mr. Name, Designation" value={billToAttn} onChange={setBillToAttn} />
                    <Field label="GSTIN" placeholder="32XXXXXX1234Z5" value={billToGstin} onChange={setBillToGstin} />
                    <Field label="PO Reference" placeholder="KSCB/PO/2025/0089" value={billToPoRef} onChange={setBillToPoRef} />
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Full Address</Label>
                      <Input placeholder="Street, City, State, PIN" value={billToAddress} onChange={e => setBillToAddress(e.target.value)} className="bg-background/50 border-primary/20 h-11" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 glass">
                  <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <PlusCircle className="w-4 h-4" /> Line Items
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={addItem} className="text-primary hover:text-primary/80">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-primary/5 text-[10px] uppercase font-bold text-muted-foreground border-b border-primary/10">
                        <tr>
                          <th className="px-3 py-3 w-8">#</th>
                          <th className="px-3 py-3 min-w-[200px]">Description of Work / Materials</th>
                          <th className="px-2 py-3 w-18">HSN/SAC</th>
                          <th className="px-2 py-3 w-14">Qty</th>
                          <th className="px-2 py-3 w-16">Unit</th>
                          <th className="px-2 py-3 w-26">Rate</th>
                          <th className="px-2 py-3 w-14">GST%</th>
                          <th className="px-2 py-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/10">
                        {items.map((item, idx) => (
                          <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                            <td className="px-3 py-2 text-xs text-muted-foreground font-bold text-center">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <Input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm" placeholder="Item description..." />
                            </td>
                            <td className="px-2 py-2">
                              <Input value={item.hsn} onChange={e => updateItem(item.id, "hsn", e.target.value)} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center" />
                            </td>
                            <td className="px-2 py-2">
                              <Input type="number" value={item.qty} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center" />
                            </td>
                            <td className="px-2 py-2">
                              <Input value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center" placeholder="Cu.m" />
                            </td>
                            <td className="px-2 py-2">
                              <Input type="number" value={item.rate} onChange={e => updateItem(item.id, "rate", Number(e.target.value))} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-right" />
                            </td>
                            <td className="px-2 py-2">
                              <Input type="number" value={item.gst} onChange={e => updateItem(item.id, "gst", Number(e.target.value))} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center" />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>

              {/* ── RIGHT COLUMN: SETTINGS ── */}
              <div className="space-y-8">
                <Card className="border-primary/20 glass sticky top-24">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <Settings2 className="w-4 h-4" /> Adjustments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Discount %</Label>
                        <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} className="bg-background/50 border-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">TDS %</Label>
                        <Input type="number" value={tdsPercent} onChange={e => setTdsPercent(Number(e.target.value))} className="bg-background/50 border-primary/20" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">GST Type</Label>
                      <div className="flex bg-primary/10 p-1 rounded-lg">
                        <button onClick={() => setIsCgstSgst(true)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${isCgstSgst ? "bg-primary text-primary-foreground" : "text-primary/60"}`}>LOCAL (CGST+SGST)</button>
                        <button onClick={() => setIsCgstSgst(false)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${!isCgstSgst ? "bg-primary text-primary-foreground" : "text-primary/60"}`}>IGST</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Extra Charges</Label>
                        <Input type="number" value={extraCharges} onChange={e => setExtraCharges(Number(e.target.value))} className="bg-background/50 border-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Label</Label>
                        <Input value={extraLabel} onChange={e => setExtraLabel(e.target.value)} className="bg-background/50 border-primary/20" />
                      </div>
                    </div>

                    <Separator className="bg-primary/20" />

                    <div className="space-y-3">
                      <Row label="Subtotal (before GST)" value={`Rs. ${fmt(totals.subtotal)}`} />
                      {totals.discAmt > 0 && <Row label={`Discount (${discountPercent}%)`} value={`- Rs. ${fmt(totals.discAmt)}`} className="text-red-500" />}
                      {isCgstSgst ? (
                        <><Row label="CGST" value={`Rs. ${fmt(totals.cgst)}`} /><Row label="SGST" value={`Rs. ${fmt(totals.sgst)}`} /></>
                      ) : <Row label="IGST" value={`Rs. ${fmt(totals.igst)}`} />}
                      {totals.tdsAmt > 0 && <Row label={`TDS (${tdsPercent}% Sec. 194C)`} value={`- Rs. ${fmt(totals.tdsAmt)}`} className="text-red-500" />}
                      {extraCharges > 0 && <Row label={extraLabel} value={`Rs. ${fmt(extraCharges)}`} />}
                      <Separator className="bg-primary/20" />
                      <div className="flex justify-between items-end pt-1">
                        <span className="text-base font-bold uppercase tracking-tighter">Total Payable</span>
                        <span className="text-2xl font-black text-primary">Rs. {fmt(totals.final)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 py-8">
            {/* ── CONTROLS ── */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 glass p-4 rounded-full border border-primary/30 shadow-2xl z-50 print-hidden">
              <Button variant="ghost" onClick={() => setShowPreview(false)} className="rounded-full h-12 px-6 font-bold hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" /> EDIT
              </Button>
              <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 rounded-full shadow-lg shadow-primary/30">
                <Printer className="w-4 h-4 mr-2" /> SAVE AS PDF
              </Button>
            </div>

            {/* ── A4 INVOICE ── */}
            <div id="invoice-document" className="inv-a4">

              {/* ═══════ HEADER ═══════ */}
              <div className="inv-header">
                <div className="flex items-start gap-5">
                  <div className="inv-logo">
                    <Building2 className="w-8 h-8 text-zinc-950" />
                  </div>
                  <div>
                    <h1 className="inv-company-name">NALAKATH HOLDINGS</h1>
                    <p className="inv-tagline">Building Trust. Building Kerala.</p>
                    <p className="inv-contact">Nalakath Hub, Ward No. 4, Areecode, Malappuram, Kerala 673639</p>
                    <p className="inv-contact">+91 97444 00100 &nbsp;|&nbsp; info@nalakathindia.com &nbsp;|&nbsp; GSTIN: 32XXXXXX1234Z5</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[6.5px] text-primary font-bold uppercase tracking-widest opacity-50 mb-1">Corporate Identification</p>
                  <p className="text-[7px] text-zinc-500 font-mono">GSTIN: 32XXXXXX1234Z5</p>
                  <p className="text-[7px] text-zinc-500 font-mono">CIN: U45200KL2013PTC034078</p>
                </div>
              </div>

              {/* ═══════ TITLE BAND ═══════ */}
              <div className="inv-title-band">
                <h2 className="inv-title">INVOICE</h2>
                <div className="inv-title-meta">
                  <span>Original for Recipient</span>
                  <span className="sep">|</span>
                  <span>{isCgstSgst ? "CGST + SGST (Local)" : "IGST (Inter-state)"}</span>
                  <span className="sep">|</span>
                  <span>{jurisdiction} Jurisdiction</span>
                </div>
              </div>

              {/* ═══════ META: DETAILS + BILL TO ═══════ */}
              <div className="inv-meta">
                <div className="inv-meta-box">
                  <div className="inv-meta-head">Invoice Details</div>
                  <div className="inv-meta-body">
                    <MetaRow label="Invoice Number" value={invNo} />
                    <MetaRow label="Invoice Date" value={formatDate(invDate)} />
                    <MetaRow label="Due Date" value={formatDate(dueDate)} />
                    <MetaRow label="Payment Terms" value="Net 30 Days" />
                    {projectRef && <MetaRow label="Project Ref" value={projectRef} />}
                  </div>
                </div>
                <div className="inv-meta-box">
                  <div className="inv-meta-head">Bill To</div>
                  <div className="inv-meta-body">
                    <p className="text-[10.5px] font-black text-zinc-900 uppercase leading-tight mb-1">{billToName || "____________________"}</p>
                    {billToAttn && <p className="text-[7.5px] text-zinc-500">Attn: {billToAttn}</p>}
                    <p className="text-[7.5px] text-zinc-600 whitespace-pre-line leading-snug mt-0.5">{billToAddress || "____________________"}</p>
                    {billToGstin && <p className="text-[7.5px] font-bold text-zinc-500 font-mono mt-1">GSTIN: {billToGstin}</p>}
                    {billToPoRef && <p className="text-[7.5px] font-bold text-zinc-500 font-mono">PO Ref: {billToPoRef}</p>}
                  </div>
                </div>
              </div>

              {/* ═══════ PROJECT BAR ═══════ */}
              {projectDesc && (
                <div className="inv-project-bar">
                  <span className="inv-project-label">PROJECT:</span>
                  <span>{projectDesc}</span>
                </div>
              )}

              {/* ═══════ ITEMS TABLE ═══════ */}
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th className="w-8 text-center text-primary">#</th>
                      <th>Description of Work / Materials</th>
                      <th className="w-20 text-center">HSN/SAC</th>
                      <th className="w-14 text-center">Qty</th>
                      <th className="w-18 text-center">Unit</th>
                      <th className="w-28 text-right">Rate (Rs.)</th>
                      <th className="w-14 text-center">GST %</th>
                      <th className="w-32 text-right text-primary">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="text-center text-zinc-400 font-bold">{idx + 1}</td>
                        <td className="font-bold text-zinc-800">{item.description}</td>
                        <td className="text-center text-zinc-500 font-mono">{item.hsn}</td>
                        <td className="text-center font-black">{item.qty}</td>
                        <td className="text-center text-zinc-500 font-medium">{item.unit}</td>
                        <td className="text-right font-medium">{fmt(item.rate)}</td>
                        <td className="text-center text-zinc-500">{item.gst}%</td>
                        <td className="text-right font-black text-zinc-900">{fmt(item.qty * item.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ═══════ BOTTOM SECTION ═══════ */}
              <div className="inv-bottom">
                {/* LEFT: Amount in Words + Bank Details + Declaration */}
                <div className="inv-bottom-left">
                  {/* Amount in Words */}
                  <div className="inv-words-box">
                    <ScrollText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[6.5px] font-black uppercase text-amber-800/60 tracking-widest">Amount in Words:</span>
                      <p className="text-[8px] font-bold italic text-zinc-800 leading-snug mt-0.5">{toWords(totals.final)}</p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="inv-bank-box">
                    <div className="inv-bank-head">
                      <Landmark className="w-3 h-3 text-zinc-500" />
                      <span>BANK DETAILS</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <BankRow label="Bank" value="State Bank of India, Perinthalmanna" />
                      <BankRow label="Account Name" value="NALAKATH HOLDINGS" />
                      <BankRow label="Account No." value="32XXXXXXXXXX51" />
                      <BankRow label="IFSC Code" value="SBIN0001234" />
                      <BankRow label="Account Type" value="Current Account" />
                    </div>
                  </div>

                  {/* Declaration */}
                  <p className="inv-declaration">We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct to the best of our knowledge.</p>
                </div>

                {/* RIGHT: Tax Totals + Signature */}
                <div className="inv-bottom-right">
                  {/* Totals Breakdown */}
                  <div className="inv-tax-box">
                    <TaxRow label="Subtotal (before GST)" value={fmt(totals.subtotal)} />
                    {totals.discAmt > 0 && <TaxRow label={`Discount (${discountPercent}%)`} value={`- ${fmt(totals.discAmt)}`} className="text-red-600" />}
                    {isCgstSgst ? (
                      <>
                        <TaxRow label={`CGST (${(items[0]?.gst ?? 18) / 2}%)`} value={fmt(totals.cgst)} />
                        <TaxRow label={`SGST (${(items[0]?.gst ?? 18) / 2}%)`} value={fmt(totals.sgst)} />
                      </>
                    ) : (
                      <TaxRow label="IGST" value={fmt(totals.igst)} />
                    )}
                    {extraCharges > 0 && <TaxRow label={extraLabel} value={fmt(extraCharges)} />}
                    {totals.tdsAmt > 0 && <TaxRow label={`TDS Deductible (${tdsPercent}% Sec. 194C)`} value={`- ${fmt(totals.tdsAmt)}`} className="text-red-600" />}
                  </div>

                  {/* Total Amount */}
                  <div className="inv-total-box">
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-primary/60 mb-0.5">Total Amount Payable</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-white/50">Rs.</span>
                      <span className="text-3xl font-black tracking-tighter text-primary">{fmt(totals.final)}</span>
                    </div>
                  </div>

                  {/* Terms + Signature row */}
                  <div className="flex justify-between items-end mt-2">
                    <div className="inv-terms">
                      <p className="text-[7px] font-black text-zinc-500 uppercase tracking-wider mb-1">Terms & Conditions</p>
                      <p>1. Payment due within 30 days of invoice date.</p>
                      <p>2. Interest @ 18% p.a. on overdue amounts.</p>
                      <p>3. Disputes subject to Malappuram jurisdiction.</p>
                      <p>4. This is a computer-generated invoice.</p>
                    </div>
                    <div className="inv-signature">
                      <div className="inv-stamp">
                        <div className="inv-stamp-inner">
                          <span>Nalakath<br />Holdings<br />Malappuram</span>
                        </div>
                      </div>
                      <div className="w-28 h-px bg-zinc-900 mb-0.5" />
                      <p className="text-[8px] font-black uppercase tracking-wider text-zinc-900">Authorised Signatory</p>
                      <p className="text-[6.5px] font-bold text-zinc-400 uppercase tracking-wider">For Nalakath Holdings</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════ FOOTER ═══════ */}
              <div className="inv-footer">
                <div className="flex gap-3 items-center flex-wrap">
                  <span className="text-[6.5px] font-black text-white/80 uppercase tracking-wider">Nalakath Holdings</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[6.5px] font-bold text-white/40">Nalakath Hub, Areecode, Malappuram</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[6.5px] font-bold text-white/40">+91 97444 00100</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[6.5px] font-bold text-white/40">nalakathindia.com</span>
                </div>
                <div className="text-[6.5px] font-black text-primary/60 uppercase">Page 1 of 1</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRINT STYLES ── */}
      <style jsx global>{`
        /* Hide everything except the invoice when printing */
        @media print {
          body > *:not(#invoice-document) { display: none !important; }
          body { background: white !important; }
          #invoice-document { 
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            box-shadow: none !important;
            transform: none !important;
          }
          .print-hidden { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <style jsx>{`
        .inv-a4 { width: 100%; max-width: 210mm; background: white; color: black; font-family: system-ui, sans-serif; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; }

        /* ── HEADER ── */
        .inv-header { background: #09090b; padding: 20px 24px 16px; display: flex; justify-content: space-between; align-items: flex-start; }
        .inv-logo { width: 44px; height: 44px; background: hsl(var(--primary)); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .inv-company-name { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; color: hsl(var(--primary)); line-height: 1.1; }
        .inv-tagline { font-size: 7px; color: hsl(var(--primary) / 0.7); text-transform: uppercase; letter-spacing: 0.2em; margin-top: 4px; font-weight: 700; font-style: italic; }
        .inv-contact { font-size: 6.5px; color: #52525b; line-height: 1.5; }

        /* ── TITLE BAND ── */
        .inv-title-band { background: hsl(var(--primary)); padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; }
        .inv-title { font-size: 15px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #09090b; }
        .inv-title-meta { font-size: 7px; font-weight: 700; color: rgba(9,9,11,0.7); text-transform: uppercase; letter-spacing: 0.05em; display: flex; gap: 8px; align-items: center; }
        .inv-title-meta .sep { opacity: 0.4; }

        /* ── META SECTION ── */
        .inv-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px 24px 8px; }
        .inv-meta-box { border: 1px solid #e4e4e7; border-radius: 10px; overflow: hidden; }
        .inv-meta-head { background: #f4f4f5; padding: 6px 12px; border-bottom: 1px solid #e4e4e7; font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; }
        .inv-meta-body { padding: 10px 12px; }
        .inv-meta-row { display: flex; justify-content: space-between; align-items: center; padding: 1.5px 0; font-size: 7.5px; }
        .inv-meta-row .label { color: #71717a; font-weight: 500; }
        .inv-meta-row .value { font-weight: 700; color: #18181b; }

        /* ── PROJECT BAR ── */
        .inv-project-bar { margin: 4px 24px 0; background: #09090b; padding: 6px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; border: 1px solid #27272a; }
        .inv-project-label { font-size: 7px; font-weight: 900; color: hsl(var(--primary)); text-transform: uppercase; letter-spacing: 0.1em; }
        .inv-project-bar span:last-child { font-size: 8.5px; color: #d4d4d8; font-weight: 700; }

        /* ── TABLE ── */
        .inv-table-wrap { padding: 8px 24px 4px; flex: 1; }
        .inv-table { width: 100%; border-collapse: collapse; border: 1px solid #e4e4e7; border-radius: 10px; overflow: hidden; font-size: 8px; }
        .inv-table thead { background: #09090b; color: white; }
        .inv-table th { padding: 8px 6px; font-size: 7.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
        .inv-table td { padding: 6px; border-top: 1px solid #f4f4f5; }
        .inv-table tbody tr:first-child td { border-top: none; }
        .inv-table tbody tr:hover { background: #fafafa; }

        /* ── BOTTOM ── */
        .inv-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 4px 24px 8px; }
        .inv-bottom-left { display: flex; flex-direction: column; gap: 8px; }
        .inv-bottom-right { display: flex; flex-direction: column; gap: 8px; }

        /* Amount in Words */
        .inv-words-box { background: #fffbeb; padding: 8px 10px; border-radius: 10px; border: 1px solid #fef3c7; display: flex; gap: 8px; align-items: flex-start; }

        /* Bank Details */
        .inv-bank-box { border: 1px solid #e4e4e7; border-radius: 10px; overflow: hidden; }
        .inv-bank-head { background: #f4f4f5; padding: 6px 10px; border-bottom: 1px solid #e4e4e7; font-size: 6.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; display: flex; align-items: center; gap: 5px; }
        .inv-bank-row { display: flex; justify-content: space-between; font-size: 7px; align-items: center; }
        .inv-bank-row .label { color: #71717a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 6.5px; }
        .inv-bank-row .value { font-weight: 900; color: #18181b; font-family: monospace; }

        /* Declaration */
        .inv-declaration { font-size: 6px; color: #a1a1aa; font-style: italic; line-height: 1.4; padding-left: 2px; border-left: 2px solid #d4d4d8; padding-left: 6px; }

        /* Tax Box */
        .inv-tax-box { background: #fafafa; padding: 10px 12px; border-radius: 10px; border: 1px solid #e4e4e7; }
        .inv-tax-row { display: flex; justify-content: space-between; font-size: 8px; padding: 2px 0; }
        .inv-tax-row .label { color: #71717a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; font-size: 7px; }
        .inv-tax-row .value { font-weight: 900; color: #18181b; }
        .inv-tax-row.text-red-600 .value { color: #dc2626; }

        /* Total Box */
        .inv-total-box { background: #09090b; border-radius: 14px; padding: 12px; text-align: center; color: white; position: relative; overflow: hidden; }
        .inv-total-box::before { content: ''; position: absolute; top: -30px; right: -30px; width: 80px; height: 80px; background: hsl(var(--primary) / 0.1); border-radius: 50%; }

        /* Terms */
        .inv-terms { font-size: 6px; color: #a1a1aa; line-height: 1.5; max-width: 160px; }

        /* Signature */
        .inv-signature { display: flex; flex-direction: column; align-items: center; text-align: center; flex-shrink: 0; }
        .inv-stamp { width: 48px; height: 48px; border: 2px solid #e4e4e7; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 4px; opacity: 0.4; }
        .inv-stamp-inner { position: absolute; inset: 4px; border: 1px dashed #e4e4e7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 4.5px; font-weight: 900; color: #a1a1aa; text-align: center; text-transform: uppercase; line-height: 1.2; }

        /* Footer */
        .inv-footer { margin-top: auto; background: #09090b; padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 2px solid hsl(var(--primary)); }
      `}</style>
    </div>
  );
}

// ── SUB-COMPONENTS ──

function Field({ label, value, onChange, type = "text", placeholder, readOnly }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase font-bold text-muted-foreground">{label}</Label>
      <Input type={type} value={value} readOnly={readOnly} placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        className="bg-background/50 border-primary/20 h-11" />
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="inv-meta-row">
      <span className="label">{label}:</span>
      <span className="value">{value}</span>
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="inv-bank-row">
      <span className="label">{label}:</span>
      <span className="value">{value}</span>
    </div>
  );
}

function TaxRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`inv-tax-row ${className || ''}`}>
      <span className="label">{label}</span>
      <span className="value">{value.startsWith('-') ? value : `Rs. ${value}`}</span>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between text-sm ${className || ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
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
