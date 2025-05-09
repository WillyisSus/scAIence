import { NextResponse } from "next/server";
import fsPromises from 'fs/promises';
import { join } from 'path';
import { read } from "fs";

async function getAllUploadedData(): Promise<{}> {
  let result = {};

  try {
    await fsPromises.access('./public/uploaddata.json', fsPromises.constants.R_OK)
    const readdata = await fsPromises.readFile('./public/uploaddata.json')
    result = JSON.parse((readdata).toString())
  } catch (error) {
    console.error('Error reading folders:', error);
  }

  return result;
}
export async function GET(req: { json: () => any; }, res: any) {
    try {
        const uploadedData = await getAllUploadedData()
        return NextResponse.json({ output: JSON.stringify(uploadedData) })
    }
    catch (error) {
        return NextResponse.json({ output: "we aint good"}, { status: 404 })
    }
}