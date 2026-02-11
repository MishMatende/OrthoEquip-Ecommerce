import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#555",
  },

  logoBox: {
    width: 140,
    height: 90,
    border: "1px solid #ccc",
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#d9f1ff",
  },

  logo: {
    width: 120,
    height: 70,
    objectFit: "contain",
  },

  quoteMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 10,
  },

  metaBlock: {
    width: "48%",
  },

  metaLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 2,
  },

  metaValue: {
    fontSize: 10,
    fontWeight: "bold",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  infoBlock: {
    width: "48%",
    lineHeight: 1.4,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },

  bold: {
    fontWeight: "bold",
  },

  table: {
    width: "100%",
    border: "1px solid #000",
    marginTop: 6,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f7eaea",
    borderBottom: "1px solid #000",
    paddingVertical: 4,
  },

  row: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    paddingVertical: 4,
  },

  cellNo: {
    width: "5%",
    borderRight: "1px solid #000",
    paddingLeft: 4,
    paddingRight: 4,
  },

  cellDesc: {
    width: "30%",
    borderRight: "1px solid #000",
    paddingLeft: 4,
    paddingRight: 4,
  },

  cellPack: {
    width: "15%",
    borderRight: "1px solid #000",
    paddingLeft: 4,
    paddingRight: 4,
  },

  cellQty: {
    width: "10%",
    borderRight: "1px solid #000",
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "center",
  },

  cellUnit: {
    width: "15%",
    borderRight: "1px solid #000",
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "right",
  },

  cellVat: {
    width: "10%",
    borderRight: "1px solid #000",
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "right",
  },

  cellTotal: {
    width: "15%",
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "right",
  },

  headerText: {
    fontWeight: "bold",
    fontSize: 9,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#f7eaea",
    borderTop: "1px solid #000",
  },

  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },

  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
  },

  termsSection: {
    marginTop: 12,
    paddingTop: 8,
  },

  termsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },

  termsText: {
    fontSize: 9,
    lineHeight: 1.4,
  },

  highlight: {
    backgroundColor: "#f7eaea",
    paddingHorizontal: 3,
    paddingVertical: 1,
    fontWeight: "bold",
  },
});

function formatKES(amount) {
  return `KES ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;
}

export default function QuotePDF({ quote, createdBy }) {
  const items = quote?.order_items || [];

  const computedTotal = items.reduce(
    (sum, i) => sum + Number(i.quantity) * Number(i.price),
    0,
  );

  const grandTotal = quote?.total ?? computedTotal;

  const quoteDate = quote?.created_at
    ? new Date(quote.created_at).toLocaleDateString()
    : new Date().toLocaleDateString();

  const quoteNumber = quote?.quote_number || quote?.id?.slice(0, 6);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Quotation</Text>

            <View style={styles.quoteMetaRow}>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>QUOTE NUMBER</Text>
                <Text style={styles.metaValue}>{quoteNumber}</Text>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>QUOTE DATE</Text>
                <Text style={styles.metaValue}>{quoteDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.logoBox}>
            <Image src={BalmOrthoLogo} style={styles.logo} />
          </View>
        </View>

        {/* CUSTOMER + COMPANY */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.sectionTitle}>Quoting to:</Text>

            <Text style={styles.bold}>
              {quote?.customers?.name || "Customer"}
            </Text>

            <Text>{quote?.customers?.address || "—"}</Text>
            <Text>{quote?.customers?.city || "Nairobi"}</Text>

            <Text style={{ marginTop: 4 }}>
              <Text style={styles.bold}>Phone:</Text>{" "}
              {quote?.customers?.phone || "—"}
            </Text>
            <Text>
              <Text style={styles.bold}>Email:</Text>{" "}
              {quote?.customers?.email || "—"}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.sectionTitle}>From:</Text>

            <Text style={styles.bold}>Balm Ortho Medical supplies</Text>
            <Text>Nairobi</Text>

            <Text style={{ marginTop: 4 }}>
              <Text style={styles.bold}>Quote by:</Text> {createdBy || "Admin"}
            </Text>

            <Text>
              <Text style={styles.bold}>Phone:</Text> {"0100219639"}
            </Text>
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.table}>
          {/* HEADER */}
          <View style={styles.tableHeader}>
            <Text style={[styles.cellNo, styles.headerText]}>#</Text>
            <Text style={[styles.cellDesc, styles.headerText]}>
              DESCRIPTION
            </Text>
            <Text style={[styles.cellPack, styles.headerText]}>Pack size</Text>
            <Text style={[styles.cellQty, styles.headerText]}>Qnty</Text>
            <Text style={[styles.cellUnit, styles.headerText]}>UNIT COST</Text>
            <Text style={[styles.cellVat, styles.headerText]}>VAT</Text>
            <Text style={[styles.cellTotal, styles.headerText]}>
              Total amount
            </Text>
          </View>

          {/* ROWS */}
          {items.map((item, idx) => {
            const qty = Number(item.quantity || 0);
            const unit = Number(item.price || 0);
            const lineTotal = qty * unit;

            return (
              <View style={styles.row} key={idx}>
                <Text style={styles.cellNo}>{idx + 1}</Text>
                <Text style={styles.cellDesc}>
                  {item.products?.name || "Unknown product"}
                </Text>
                <Text style={styles.cellPack}>{item.pack_size || "-"}</Text>
                <Text style={styles.cellQty}>{qty}</Text>
                <Text style={styles.cellUnit}>
                  {unit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text style={styles.cellVat}>-</Text>
                <Text style={styles.cellTotal}>
                  {lineTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            );
          })}

          {/* TOTAL */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatKES(grandTotal)}</Text>
          </View>
        </View>

        {/* TERMS */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>TERMS</Text>

          <Text style={styles.termsText}>
            The quotation must remain valid for a period of 30 days from the
            date of submission. Availability of items will be reviewed once the
            quote is approved.
          </Text>

          <Text style={styles.termsText}>
            <Text style={styles.highlight}>
              Payment should be done prior to supply of items.
            </Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}
