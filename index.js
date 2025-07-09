const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors()); // ✅ Enable CORS

const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ OData-like /flights endpoint
app.get('/odata/flights', async (req, res) => {
  try {
    let query = supabase.from('flights').select('*');

    if (req.query['$filter']) {
      const filter = req.query['$filter'];
      const [column, , value] = filter.split(' ');
      const val = value.replace(/'/g, '');
      query = query.eq(column, val);
    }

    if (req.query['$top']) {
      query = query.limit(parseInt(req.query['$top']));
    }

    if (req.query['$skip']) {
      query = query.range(
        parseInt(req.query['$skip']),
        parseInt(req.query['$skip']) + (req.query['$top'] ? parseInt(req.query['$top']) - 1 : 9)
      );
    }

    if (req.query['$orderby']) {
      const [col, order] = req.query['$orderby'].split(' ');
      query = query.order(col, { ascending: order !== 'desc' });
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error });

    res.json({
      '@odata.context': req.protocol + '://' + req.get('host') + '/odata/$metadata',
      value: data
    });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ✅ $metadata endpoint for SAP Analytics Cloud
app.get('/odata/$metadata', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0"
  xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="ODataService"
      xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="Flight">
        <Key>
          <PropertyRef Name="id" />
        </Key>
        <Property Name="id" Type="Edm.Int32" Nullable="false" />
        <Property Name="airline" Type="Edm.String" />
        <Property Name="departure" Type="Edm.String" />
        <Property Name="arrival" Type="Edm.String" />
        <Property Name="status" Type="Edm.String" />
      </EntityType>
      <EntityContainer Name="Default">
        <EntitySet Name="flights" EntityType="ODataService.Flight" />
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`);
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`OData server running at http://localhost:${port}/odata/flights`);
});
