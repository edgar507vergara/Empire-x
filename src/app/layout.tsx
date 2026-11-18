import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'EMPIRE X — Business Empire Simulator',description:'Una ciudad de oportunidades. Construye tu empresa, forma un equipo y domina el arte de hacer negocios.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
