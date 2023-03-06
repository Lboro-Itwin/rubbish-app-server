import { createClient } from "@supabase/supabase-js";

//should probably be in process.env but I literally do not care
const supabaseUrl = 'https://gjugvzrcpatqfewlwvvt.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdWd2enJjcGF0cWZld2x3dnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzYyNzk0NDQsImV4cCI6MTk5MTg1NTQ0NH0.ENJfEtVHtSxRNfg_AZ0YA_5htLbtmjGTTP9O4MEGMBw"

const supabase = createClient(supabaseUrl, supabaseKey);

async function getRecords() {
    return await supabase.from("coords").select();
}

(async () => console.log(await getRecords()))();
