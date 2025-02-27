import axios from 'axios';
import {NextResponse} from 'next/server';

export const maxDuration = 30;

async function GET(req: Request) {
    // Requestオブジェクトのurlをパース
    const {searchParams} = new URL(req.url);

    // たとえば、クエリパラメータ ?name=xxx の値を取得
    const tokenId = searchParams.get('tokenId');

    try {
        if (!process.env.LAMBDA_END_POINT) {
            return NextResponse.json({"message": "API key is not set", status: 500});
        }
        const response = await axios.get(process.env.LAMBDA_END_POINT, {
            headers: {
                'Content-Type': 'application/json',
                "x-api-key": process.env.LAMBDA_API_KEY
            },
            params: {"tokenId": tokenId}
        });
        return NextResponse.json({"message": response.data, status: 200});
    } catch (error) {
        return NextResponse.json({"message": "Internal Server Error", status: 500});
    }
}

export {GET};