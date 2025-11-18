import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("products").select("*");
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching products:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = createServerClient();
    const body = await req.json();
    
    // Validation basique
    if (!body.name || !body.price || !body.seller_id) {
      return NextResponse.json(
        { error: "Les champs name, price et seller_id sont requis" },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase.from("products").insert([body]).select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    console.error("Error creating product:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "L'ID du produit est requis" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { data, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", id)
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data[0]);
  } catch (err) {
    console.error("Error updating product:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "L'ID du produit est requis" },
        { status: 400 }
      );
    }
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Produit supprimé avec succès" });
  } catch (err) {
    console.error("Error deleting product:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
