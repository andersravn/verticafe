import { google } from "googleapis";
import React, { useState } from "react";
import { AxisOptions, Chart } from "react-charts";
import {
  Button,
  Heading,
  Box,
  Text,
  Center,
  AspectRatio,
  Container,
} from "@chakra-ui/react";

export async function getServerSideProps() {
  const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

  const jwt = new google.auth.JWT(
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    null,
    // we need to replace the escaped newline characters
    // https://stackoverflow.com/questions/50299329/node-js-firebase-service-account-private-key-wont-parse
    process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes
  );

  const sheets = google.sheets({ version: "v4", auth: jwt });

  const typesRange = `S1!B1:F1`;
  const typesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: typesRange,
  });

  const totalsRange = `Totals!A:B`;
  const totalsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: totalsRange,
  });

  const totalsByTypeRange = `TotalsByType!A:F`;
  const totalsByTypeResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: totalsByTypeRange,
  });

  return {
    props: {
      types: typesResponse.data.values,
      totals: totalsResponse.data.values,
      totalsByType: totalsByTypeResponse.data.values,
    },
  };
}

type Coffee = {
  date: string;
  cups: number;
};

type Series = {
  label: string;
  data: Coffee[];
};

type Props = {
  types: string[][];
  totals: string[][];
  totalsByType: string[][];
};

export default function Home(props: Props) {
  const [showTypes, setShowTypes] = useState(false);

  const total = props.totals.reduce((prev, cur) => prev + Number(cur[1]), 0);

  const primaryAxis = React.useMemo(
    (): AxisOptions<Coffee> => ({
      getValue: (datum) => datum.date,
    }),
    []
  );

  const secondaryAxes = React.useMemo(
    (): AxisOptions<Coffee>[] => [
      {
        getValue: (datum) => datum.cups,
        elementType: "line",
      },
    ],
    []
  );

  let data: Series[] = [];

  const totalsData: Series[] = [
    {
      label: "Coffee",
      data: props.totals.map((t) => ({ date: t[0], cups: Number(t[1]) })),
    },
  ];

  const typesData: Series[] = [];
  props.types[0].forEach((type, index) => {
    typesData.push({
      label: type,
      data: props.totalsByType.map((dateAndTotals) => ({
        date: dateAndTotals[0],
        cups: Number(dateAndTotals[index + 1]),
      })),
    });
  });

  data = showTypes ? typesData : totalsData;

  return (
    <Container maxWidth="100%" padding={8}>
      <Box>
        <Heading size="lg">Verticafé</Heading>
      </Box>
      <Center flexDirection="column">
        <Text fontSize="6xl">{total}</Text>
        <Text>cups in total</Text>
      </Center>
      <AspectRatio maxH="50vh" marginTop={16}>
        <Chart
          options={{
            data,
            primaryAxis,
            secondaryAxes,
          }}
        />
      </AspectRatio>
      <div>
        <Button onClick={() => setShowTypes(!showTypes)} colorScheme="blue">
          {!showTypes ? "Show" : "Hide"} types
        </Button>
      </div>
    </Container>
  );
}
