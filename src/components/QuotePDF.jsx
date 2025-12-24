import { Document, Page, Text, View } from "@react-pdf/renderer";

export default function QuotePDF({ quote }) {
  return (
    <Document>
      <Page size="A4" style={{ padding: 24 }}>
        <Text style={{ fontSize: 20, marginBottom: 10 }}>Quotation</Text>

        <Text>Status: {quote.quote_status}</Text>
        <Text>Total: {quote.total}</Text>

        <View style={{ marginTop: 10 }}>
          {quote.order_items.map((i, idx) => (
            <Text key={idx}>
              {i.products.name} — {i.quantity} × {i.price}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
