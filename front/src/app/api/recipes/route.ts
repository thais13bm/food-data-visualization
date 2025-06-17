import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "..",
    "data",
    "recipes_cleaned.csv"
  );

  try {
    const results: any[] = [];

    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
      // Aqui você pode fazer um slice() ou filter para não carregar tudo
      results.push(row);
      if (results.length >= 1000) break; // por exemplo: só os primeiros 1000
    }

    return NextResponse.json(results);
  } catch (err) {
    return new NextResponse("Erro ao ler o CSV", { status: 500 });
  }
}
