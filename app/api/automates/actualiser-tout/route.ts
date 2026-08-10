import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

    try {

        const cookie = req.headers.get("cookie") || "";

        const resultat = {
            nfs: null as any,
            hormones: null as any,
            vs: null as any,
            biochimie: null as any,
        };

        // NFS
        try {

            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/automates/nfs/import`,
                    {
                        method: "POST",
                        headers: { cookie }
                    }
                );

            resultat.nfs =
                await response.json();

        } catch (error: any) {

            resultat.nfs = {
                success: false,
                message: error.message
            };
        }

        // HORMONES
        try {

            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/automates/hormones/import`,
                    {
                        method: "POST",
                        headers: { cookie }
                    }
                );

            resultat.hormones =
                await response.json();

        } catch (error: any) {

            resultat.hormones = {
                success: false,
                message: error.message
            };
        }

        // VS
        try {

            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/automates/vs/import`,
                    {
                        method: "POST",
                        headers: { cookie }
                    }
                );

            resultat.vs =
                await response.json();

        } catch (error: any) {

            resultat.vs = {
                success: false,
                message: error.message
            };
        }

        // BIOCHIMIE
        try {

            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/automates/biochimies/import`,
                    {
                        method: "POST",
                        headers: { cookie }
                    }
                );

            resultat.biochimie =
                await response.json();

        } catch (error: any) {

            resultat.biochimie = {
                success: false,
                message: error.message
            };
        }

        return NextResponse.json({

            success: true,

            message:
                "Tous les automates ont été actualisés",

            resultat
        });

    } catch (error: any) {

        return NextResponse.json(
            {
                success: false,
                message:
                    error.message
            },
            {
                status: 500
            }
        );
    }
}