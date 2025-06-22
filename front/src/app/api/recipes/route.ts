import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "..",
    "data_resampled",
    "recipes_sampled.csv"
  );

  try {
    const results: any[] = [];

    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
      results.push(row);

    }

    return NextResponse.json(results);
  } catch (err) {
    return new NextResponse("Erro ao ler o CSV", { status: 500 });
  }
}
