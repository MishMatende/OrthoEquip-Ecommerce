import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  logo: {
    width: 120,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  section: {
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#000",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
  },

  th: {
    padding: 6,
    fontWeight: "bold",
    flex: 1,
  },

  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },

  td: {
    padding: 6,
    flex: 1,
  },

  total: {
    marginTop: 12,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "bold",
  },

  terms: {
    marginTop: 20,
    fontSize: 9,
  },
});

export default function QuotePDF({ quote }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Quotation</Text>
            <Text>Quote #: {quote.id}</Text>
            <Text>Date: {new Date(quote.created_at).toLocaleDateString()}</Text>
          </View>

          {/* Optional logo */}
          {/* <Image src="/logo.png" style={styles.logo} /> */}
        </View>

        {/* CUSTOMER */}
        <View style={styles.section}>
          <Text style={{ fontWeight: "bold" }}>Quoting To:</Text>
          <Text>{quote.profiles?.username || "Customer"}</Text>
          <Text>{quote.profiles?.phone}</Text>
          <Text>{quote.profiles?.email}</Text>
        </View>

        {/* ITEMS TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>Description</Text>
            <Text style={styles.th}>Qty</Text>
            <Text style={styles.th}>Unit Price</Text>
            <Text style={styles.th}>Total</Text>
          </View>

          {quote.order_items.map((item, i) => (
            <View key={i} style={styles.tr}>
              <Text style={styles.td}>{item.products.name}</Text>
              <Text style={styles.td}>{item.quantity}</Text>
              <Text style={styles.td}>{item.price.toFixed(2)}</Text>
              <Text style={styles.td}>
                {(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTAL */}
        <Text style={styles.total}>
          Total Amount: KES {quote.total.toFixed(2)}
        </Text>

        {/* TERMS */}
        <View style={styles.terms}>
          <Text>Terms & Conditions:</Text>
          <Text>
            • This quotation is valid for 30 days from the date of issue.
          </Text>
          <Text>• Payment is required before supply of items.</Text>
        </View>
      </Page>
    </Document>
  );
}
