const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

// Supabase credentials
const supabaseUrl = 'https://hwhrfwppemfxnfmpixxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3aHJmd3BwZW1meG5mbXBpeHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDQyNzQsImV4cCI6MjA2Njc4MDI3NH0.tq6ABnrHX8eCSwy20WF4hhzFBDiR8BmxR9nqlhke6Qg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic OData-like query support
app.get('/odata/flights', async (req, res) => {
  try {
    let query = supabase.from('flights').select('*');

    // Filtering example: ?$filter=UniqueCarrier eq 'AA'
    if (req.query['$filter']) {
      const filter = req.query['$filter']; // e.g. UniqueCarrier eq 'AA'
      const [column, , value] = filter.split(' ');
      const val = value.replace(/'/g, '');
      query = query.eq(column, val);
    }

    // Pagination: ?$top=10&$skip=20
    if (req.query['$top']) {
      query = query.limit(parseInt(req.query['$top']));
    }

    if (req.query['$skip']) {
      query = query.range(parseInt(req.query['$skip']), parseInt(req.query['$skip']) + (req.query['$top'] ? parseInt(req.query['$top']) - 1 : 9));
    }

    // Sorting: ?$orderby=Year desc
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

// Simple metadata endpoint
app.get('/odata/$metadata', (req, res) => {
  res.type('application/xml');
  res.send(`
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="flightData" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="Flight">
        <Key>
          <PropertyRef Name="index" />
        </Key>
        <Property Name="Year" Type="Edm.Int32" />
        <Property Name="Month" Type="Edm.Int32" />
        <Property Name="DayofMonth" Type="Edm.Int32" />
        <Property Name="DayOfWeek" Type="Edm.Int32" />
        <Property Name="DepTime" Type="Edm.Int32" />
        <Property Name="CRSDepTime" Type="Edm.Int32" />
        <Property Name="ArrTime" Type="Edm.Int32" />
        <Property Name="CRSArrTime" Type="Edm.Int32" />
        <Property Name="UniqueCarrier" Type="Edm.String" />
        <Property Name="FlightNum" Type="Edm.String" />
        <Property Name="TailNum" Type="Edm.String" />
        <Property Name="ActualElapsedTime" Type="Edm.Int32" />
        <Property Name="CRSElapsedTime" Type="Edm.Int32" />
        <Property Name="AirTime" Type="Edm.Int32" />
        <Property Name="ArrDelay" Type="Edm.Int32" />
        <Property Name="DepDelay" Type="Edm.Int32" />
        <Property Name="Origin" Type="Edm.String" />
        <Property Name="Dest" Type="Edm.String" />
        <Property Name="Distance" Type="Edm.Int32" />
        <Property Name="TaxiIn" Type="Edm.Int32" />
        <Property Name="TaxiOut" Type="Edm.Int32" />
        <Property Name="Cancelled" Type="Edm.Boolean" />
        <Property Name="CancellationCode" Type="Edm.String" />
        <Property Name="Diverted" Type="Edm.Boolean" />
        <Property Name="CarrierDelay" Type="Edm.Int32" />
        <Property Name="WeatherDelay" Type="Edm.Int32" />
        <Property Name="NASDelay" Type="Edm.Int32" />
        <Property Name="SecurityDelay" Type="Edm.Int32" />
        <Property Name="LateAircraftDelay" Type="Edm.Int32" />
      </EntityType>
      <EntityContainer Name="Container">
        <EntitySet Name="flights" EntityType="flightData.Flight" />
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>
  `);
});

// Start server
app.listen(port, () => {
  console.log(`OData server running at http://localhost:${port}/odata/flights`);
});
