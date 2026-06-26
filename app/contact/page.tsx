import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar current="contact" />

      <section className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
          Contact Us
        </p>
        <h1 className="mt-2 text-4xl font-bold">Need Help?</h1>
        <p className="mt-3 text-slate-300">
          If you have questions about topup, payment or order support, contact us
          using the information below.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold text-cyan-400">Support Info</h2>

            <div className="mt-5 space-y-4 text-slate-300">
              <p>
                <span className="font-semibold text-white">Phone:</span>{" "}
                +977-9800000000
              </p>
              <p>
                <span className="font-semibold text-white">Email:</span>{" "}
                support@topupcenter.com
              </p>
              <p>
                <span className="font-semibold text-white">WhatsApp:</span>{" "}
                +977-9800000000
              </p>
              <p>
                <span className="font-semibold text-white">Facebook:</span>{" "}
                TopupCenter Nepal
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold text-cyan-400">Office Hours</h2>

            <div className="mt-5 space-y-3 text-slate-300">
              <p>Sunday - Friday: 8:00 AM - 8:00 PM</p>
              <p>Saturday: 10:00 AM - 5:00 PM</p>
              <p>Fast reply during active support hours.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}