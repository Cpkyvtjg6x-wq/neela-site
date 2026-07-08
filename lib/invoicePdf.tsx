"use client";
// Génère un VRAI fichier PDF (vectoriel, A4) et le télécharge en .pdf.
// Un .pdf téléchargé s'ouvre dans Aperçu (Mac) / le lecteur PDF par défaut (Windows).
// Module chargé à la demande (import dynamique) pour ne pas alourdir le bundle CRM.
import { Document, Page, View, Text, StyleSheet, pdf } from "@react-pdf/renderer";
import {
  computeTotals, eur2, montantEnLettres, fmtDateFr, LEGAL_MENTIONS, DEFAULT_TERMS, type Invoice,
} from "./invoices";

const C = { ink: "#0A0A0A", mut: "#6B7280", line: "#e3e3e0", accent: "#2563EB", legal: "#aab0ba" };

const s = StyleSheet.create({
  page: { position: "relative", paddingTop: 46, paddingBottom: 70, paddingHorizontal: 48, fontSize: 9.5, color: C.ink, fontFamily: "Helvetica", lineHeight: 1.45, flexDirection: "column" },
  bar: { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: C.accent },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginRight: 7 },
  brand: { fontSize: 17, fontFamily: "Helvetica-Bold" },
  emCoords: { marginTop: 7, fontSize: 8.5, color: C.mut, lineHeight: 1.5 },
  docTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "right" },
  meta: { marginTop: 6, fontSize: 8.5, color: C.mut, textAlign: "right", lineHeight: 1.6 },
  metaB: { fontFamily: "Helvetica-Bold", color: C.ink },
  clientWrap: { marginTop: 22, flexDirection: "row", justifyContent: "flex-end" },
  clientBox: { width: "52%" },
  lab: { fontSize: 7, color: C.mut, letterSpacing: 1, marginBottom: 3 },
  clientNom: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  clientLine: { fontSize: 8.5, color: C.mut, lineHeight: 1.5, marginTop: 2 },
  mid: { flexGrow: 1, justifyContent: "center", paddingBottom: 44 },
  thead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.ink, paddingBottom: 5 },
  th: { fontSize: 7, color: C.mut, letterSpacing: 0.6 },
  row: { flexDirection: "row", borderBottomWidth: 0.7, borderBottomColor: C.line, paddingVertical: 6 },
  cDes: { flex: 1, paddingRight: 6 },
  cQte: { width: 38, textAlign: "right" },
  cPu: { width: 72, textAlign: "right" },
  cMt: { width: 80, textAlign: "right" },
  cMtB: { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold" },
  totals: { marginLeft: "auto", width: 215, marginTop: 28 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totTot: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.5, borderTopColor: C.ink, paddingTop: 6, marginTop: 2 },
  totTotLab: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  lettres: { marginTop: 8, textAlign: "right", fontSize: 8.5, color: "#555", fontStyle: "italic" },
  mention: { marginTop: 10, fontSize: 8.5, color: "#555", fontStyle: "italic" },
  sign: { marginTop: 18 },
  sigLab: { fontSize: 8, color: C.mut },
  sigBox: { marginTop: 5, width: 180, height: 52, borderWidth: 0.7, borderColor: C.line, borderStyle: "dashed", borderRadius: 4 },
  terms: { marginTop: 22, borderTopWidth: 0.7, borderTopColor: C.line, paddingTop: 10, fontSize: 7.5, color: C.mut, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 26, left: 48, right: 48, borderTopWidth: 0.7, borderTopColor: C.line, paddingTop: 8 },
  footerT: { textAlign: "center", fontSize: 7, color: C.legal, lineHeight: 1.5 },
});

export function InvoiceDocument({ inv }: { inv: Invoice }) {
  const t = computeTotals(inv);
  const e = inv.emitter, c = inv.client;
  const isDevis = inv.doc_type === "devis";
  const rows = inv.items.filter((i) => i.designation || i.unit || i.qty);
  const amountWords = !isDevis && inv.deposit > 0 ? t.net : t.ttc;

  return (
    <Document title={`${isDevis ? "Devis" : "Facture"} ${inv.number || ""}`.trim()} author="Neela">
      <Page size="A4" style={s.page}>
        <View style={s.bar} fixed />

        {/* En-tête */}
        <View style={s.header}>
          <View style={{ maxWidth: "58%" }}>
            <View style={s.brandRow}><View style={s.dot} /><Text style={s.brand}>{e.nom || "Neela"}</Text></View>
            <Text style={s.emCoords}>
              {e.adresse}
              {e.siret ? `\nSIRET : ${e.siret}` : ""}
              {(e.email || e.tel) ? `\n${e.email}${e.email && e.tel ? " · " : ""}${e.tel}` : ""}
            </Text>
          </View>
          <View style={{ maxWidth: "40%" }}>
            <Text style={s.docTitle}>{isDevis ? "Devis" : "Facture"}</Text>
            <Text style={s.meta}>
              N° <Text style={s.metaB}>{inv.number || "—"}</Text>{"\n"}
              {isDevis ? "Émis le " : "Émise le "}{fmtDateFr(inv.issue_date)}
              {isDevis
                ? (inv.valid_until ? `\nValable jusqu'au ${fmtDateFr(inv.valid_until)}` : "")
                : `\nÉchéance : ${fmtDateFr(inv.due_date)}${inv.sale_date ? `\nPrestation : ${fmtDateFr(inv.sale_date)}` : ""}`}
            </Text>
          </View>
        </View>

        {/* Client */}
        <View style={s.clientWrap}>
          <View style={s.clientBox}>
            <Text style={s.lab}>{isDevis ? "CLIENT" : "FACTURÉ À"}</Text>
            <Text style={s.clientNom}>{c.nom || "—"}</Text>
            <Text style={s.clientLine}>
              {c.adresse}{c.siret ? `\nSIRET ${c.siret}` : ""}{c.email ? `\n${c.email}` : ""}
            </Text>
          </View>
        </View>

        {/* Prestations + totaux + conditions (centrés verticalement) */}
        <View style={s.mid}>
          <View>
            <View style={s.thead}>
              <Text style={[s.th, s.cDes]}>DÉSIGNATION</Text>
              <Text style={[s.th, s.cQte]}>QTÉ</Text>
              <Text style={[s.th, s.cPu]}>PU HT</Text>
              <Text style={[s.th, s.cMt]}>MONTANT HT</Text>
            </View>
            {rows.length ? rows.map((it, i) => (
              <View style={s.row} key={i}>
                <Text style={s.cDes}>{it.designation || "—"}</Text>
                <Text style={s.cQte}>{Number(it.qty) || 0}</Text>
                <Text style={s.cPu}>{eur2(Number(it.unit) || 0)}</Text>
                <Text style={s.cMtB}>{eur2((Number(it.qty) || 0) * (Number(it.unit) || 0))}</Text>
              </View>
            )) : (
              <View style={s.row}><Text style={{ color: C.mut }}>Aucune ligne</Text></View>
            )}
          </View>

          <View style={s.totals}>
            {t.disc > 0 && <View style={s.totRow}><Text style={{ color: C.mut }}>Remise</Text><Text>− {eur2(t.disc)}</Text></View>}
            {inv.vat_enabled ? (
              <>
                <View style={s.totRow}><Text style={{ color: C.mut }}>Total HT</Text><Text>{eur2(t.ht)}</Text></View>
                <View style={s.totRow}><Text style={{ color: C.mut }}>TVA {inv.vat_rate} %</Text><Text>{eur2(t.tva)}</Text></View>
                <View style={s.totTot}><Text style={s.totTotLab}>Montant total TTC</Text><Text style={s.totTotLab}>{eur2(t.ttc)}</Text></View>
              </>
            ) : (
              <View style={s.totTot}><Text style={s.totTotLab}>Montant total TTC</Text><Text style={s.totTotLab}>{eur2(t.ttc)}</Text></View>
            )}
            {!isDevis && inv.deposit > 0 && (
              <>
                <View style={s.totRow}><Text style={{ color: C.mut }}>Acompte versé</Text><Text>− {eur2(inv.deposit)}</Text></View>
                <View style={[s.totRow, { borderTopWidth: 0.7, borderTopColor: C.line, paddingTop: 5 }]}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Net à payer</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: C.accent }}>{eur2(t.net)}</Text>
                </View>
              </>
            )}
          </View>

          <Text style={s.lettres}>Arrêté{isDevis ? "" : "e"} à la somme de {montantEnLettres(amountWords)}.</Text>
          {!inv.vat_enabled && <Text style={s.mention}>TVA non applicable, art. 293 B du CGI.</Text>}

          {isDevis && (
            <View style={s.sign}>
              <Text style={s.sigLab}>Bon pour accord — date et signature du client :</Text>
              <View style={s.sigBox} />
            </View>
          )}

          <Text style={s.terms}>
            {isDevis
              ? `Devis valable ${inv.valid_until ? `jusqu'au ${fmtDateFr(inv.valid_until)}` : "30 jours"}. Une fois accepté, il fera l'objet d'une facture.`
              : (inv.payment_terms || DEFAULT_TERMS)}
            {inv.notes ? `\n\n${inv.notes}` : ""}
          </Text>
        </View>

        {/* Mentions légales + IBAN/BIC — épinglées en bas de page */}
        <View style={s.footer} fixed>
          <Text style={s.footerT}>
            {LEGAL_MENTIONS}{e.iban ? ` · IBAN ${e.iban}` : ""}{e.bic ? ` · BIC ${e.bic}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadInvoicePdf(inv: Invoice): Promise<void> {
  const blob = await pdf(<InvoiceDocument inv={inv} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${inv.doc_type === "devis" ? "Devis" : "Facture"}${inv.number ? ` ${inv.number}` : ""}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
