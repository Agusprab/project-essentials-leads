"use client";

import { useState } from "react";

import { createGosomJobAction } from "@/app/(dashboard)/scraping/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type CityOption = {
  label: string;
  lat: string;
  lon: string;
};

const cityOptions: CityOption[] = [
  { label: "Jakarta Pusat", lat: "-6.1805", lon: "106.8284" },
  { label: "Jakarta Selatan", lat: "-6.2615", lon: "106.8106" },
  { label: "Jakarta Barat", lat: "-6.1683", lon: "106.7588" },
  { label: "Jakarta Utara", lat: "-6.1384", lon: "106.8639" },
  { label: "Jakarta Timur", lat: "-6.2250", lon: "106.9004" },
  { label: "Tangerang", lat: "-6.1783", lon: "106.6319" },
  { label: "Tangerang Selatan", lat: "-6.2886", lon: "106.7179" },
  { label: "Bekasi", lat: "-6.2383", lon: "106.9756" },
  { label: "Depok", lat: "-6.4025", lon: "106.7942" },
  { label: "Bogor", lat: "-6.5950", lon: "106.8166" },
  { label: "Cikarang", lat: "-6.2610", lon: "107.1528" },
  { label: "Karawang", lat: "-6.3054", lon: "107.3000" },
  { label: "Bandung", lat: "-6.9175", lon: "107.6191" },
  { label: "Cimahi", lat: "-6.8722", lon: "107.5425" },
  { label: "Sukabumi", lat: "-6.9277", lon: "106.9299" },
  { label: "Cirebon", lat: "-6.7320", lon: "108.5523" },
  { label: "Tasikmalaya", lat: "-7.3506", lon: "108.2172" },
  { label: "Purwakarta", lat: "-6.5569", lon: "107.4433" },
  { label: "Serang", lat: "-6.1200", lon: "106.1503" },
  { label: "Cilegon", lat: "-6.0025", lon: "106.0111" },
  { label: "Semarang", lat: "-6.9667", lon: "110.4167" },
  { label: "Yogyakarta", lat: "-7.7956", lon: "110.3695" },
  { label: "Solo", lat: "-7.5755", lon: "110.8243" },
  { label: "Tegal", lat: "-6.8694", lon: "109.1402" },
  { label: "Kudus", lat: "-6.8048", lon: "110.8405" },
  { label: "Jepara", lat: "-6.5888", lon: "110.6679" },
  { label: "Surabaya", lat: "-7.2575", lon: "112.7521" },
  { label: "Sidoarjo", lat: "-7.4460", lon: "112.7183" },
  { label: "Gresik", lat: "-7.1567", lon: "112.6555" },
  { label: "Malang", lat: "-7.9666", lon: "112.6326" },
  { label: "Kediri", lat: "-7.8480", lon: "112.0178" },
  { label: "Denpasar", lat: "-8.6705", lon: "115.2126" },
  { label: "Mataram", lat: "-8.5833", lon: "116.1167" },
  { label: "Medan", lat: "3.5952", lon: "98.6722" },
  { label: "Pekanbaru", lat: "0.5071", lon: "101.4478" },
  { label: "Padang", lat: "-0.9471", lon: "100.4172" },
  { label: "Palembang", lat: "-2.9761", lon: "104.7754" },
  { label: "Bandar Lampung", lat: "-5.3971", lon: "105.2668" },
  { label: "Batam", lat: "1.0456", lon: "104.0305" },
  { label: "Pontianak", lat: "-0.0263", lon: "109.3425" },
  { label: "Banjarmasin", lat: "-3.3186", lon: "114.5944" },
  { label: "Samarinda", lat: "-0.4948", lon: "117.1436" },
  { label: "Balikpapan", lat: "-1.2379", lon: "116.8529" },
  { label: "Makassar", lat: "-5.1477", lon: "119.4327" },
  { label: "Manado", lat: "1.4748", lon: "124.8421" },
  { label: "Banda Aceh", lat: "5.5483", lon: "95.3238" },
  { label: "Lhokseumawe", lat: "5.1801", lon: "97.1507" },
  { label: "Binjai", lat: "3.6001", lon: "98.4854" },
  { label: "Pematangsiantar", lat: "2.9595", lon: "99.0687" },
  { label: "Tebing Tinggi", lat: "3.3285", lon: "99.1625" },
  { label: "Jambi", lat: "-1.6101", lon: "103.6131" },
  { label: "Bengkulu", lat: "-3.8004", lon: "102.2655" },
  { label: "Pangkalpinang", lat: "-2.1291", lon: "106.1138" },
  { label: "Tanjung Pinang", lat: "0.9186", lon: "104.4665" },
  { label: "Metro", lat: "-5.1131", lon: "105.3067" },
  { label: "Cibinong", lat: "-6.4819", lon: "106.8544" },
  { label: "Cibitung", lat: "-6.2616", lon: "107.0836" },
  { label: "Cikampek", lat: "-6.4197", lon: "107.4558" },
  { label: "Subang", lat: "-6.5716", lon: "107.7625" },
  { label: "Sumedang", lat: "-6.8586", lon: "107.9169" },
  { label: "Garut", lat: "-7.2157", lon: "107.9019" },
  { label: "Cianjur", lat: "-6.8173", lon: "107.1421" },
  { label: "Majalengka", lat: "-6.8364", lon: "108.2277" },
  { label: "Kuningan", lat: "-6.9758", lon: "108.4831" },
  { label: "Indramayu", lat: "-6.3264", lon: "108.3207" },
  { label: "Pekalongan", lat: "-6.8898", lon: "109.6746" },
  { label: "Purwokerto", lat: "-7.4243", lon: "109.2396" },
  { label: "Cilacap", lat: "-7.7188", lon: "109.0154" },
  { label: "Magelang", lat: "-7.4706", lon: "110.2178" },
  { label: "Salatiga", lat: "-7.3305", lon: "110.5084" },
  { label: "Klaten", lat: "-7.7059", lon: "110.6069" },
  { label: "Boyolali", lat: "-7.5331", lon: "110.5958" },
  { label: "Sragen", lat: "-7.4303", lon: "111.0213" },
  { label: "Madiun", lat: "-7.6298", lon: "111.5239" },
  { label: "Mojokerto", lat: "-7.4722", lon: "112.4336" },
  { label: "Pasuruan", lat: "-7.6453", lon: "112.9075" },
  { label: "Probolinggo", lat: "-7.7764", lon: "113.2037" },
  { label: "Jember", lat: "-8.1724", lon: "113.7003" },
  { label: "Banyuwangi", lat: "-8.2192", lon: "114.3691" },
  { label: "Blitar", lat: "-8.0955", lon: "112.1609" },
  { label: "Tulungagung", lat: "-8.0657", lon: "111.9024" },
  { label: "Batu", lat: "-7.8831", lon: "112.5334" },
  { label: "Singaraja", lat: "-8.1120", lon: "115.0882" },
  { label: "Kupang", lat: "-10.1772", lon: "123.6070" },
  { label: "Sumbawa Besar", lat: "-8.4932", lon: "117.4201" },
  { label: "Bima", lat: "-8.4643", lon: "118.7449" },
  { label: "Palangkaraya", lat: "-2.2096", lon: "113.9213" },
  { label: "Tarakan", lat: "3.3274", lon: "117.5785" },
  { label: "Singkawang", lat: "0.9093", lon: "108.9846" },
  { label: "Banjarbaru", lat: "-3.4424", lon: "114.8320" },
  { label: "Palu", lat: "-0.9003", lon: "119.8779" },
  { label: "Gorontalo", lat: "0.5435", lon: "123.0568" },
  { label: "Kendari", lat: "-3.9985", lon: "122.5120" },
  { label: "Parepare", lat: "-4.0096", lon: "119.6291" },
  { label: "Palopo", lat: "-3.0007", lon: "120.1986" },
  { label: "Bitung", lat: "1.4404", lon: "125.1217" },
  { label: "Tomohon", lat: "1.3234", lon: "124.8385" },
  { label: "Ambon", lat: "-3.6954", lon: "128.1814" },
  { label: "Ternate", lat: "0.7893", lon: "127.3812" },
  { label: "Tidore", lat: "0.6833", lon: "127.4000" },
  { label: "Jayapura", lat: "-2.5916", lon: "140.6690" },
  { label: "Sorong", lat: "-0.8762", lon: "131.2558" },
  { label: "Manokwari", lat: "-0.8615", lon: "134.0620" },
  { label: "Timika", lat: "-4.5468", lon: "136.8837" },
  { label: "Merauke", lat: "-8.4932", lon: "140.4018" },
];

export function CreateScrapingJobForm() {
  const [selectedLocation, setSelectedLocation] = useState(cityOptions[0]);
  const [citySearch, setCitySearch] = useState(cityOptions[0].label);
  const [customLocation, setCustomLocation] = useState(false);
  const [latitude, setLatitude] = useState(cityOptions[0].lat);
  const [longitude, setLongitude] = useState(cityOptions[0].lon);

  function selectLocation(nextLocation: CityOption) {
    setSelectedLocation(nextLocation);
    setCitySearch(nextLocation.label);
    setLatitude(nextLocation.lat);
    setLongitude(nextLocation.lon);
    setCustomLocation(false);
  }

  function handleCitySearchChange(value: string) {
    setCitySearch(value);

    const nextLocation = findCityOption(value);

    if (!nextLocation) {
      setCustomLocation(true);
      return;
    }

    selectLocation(nextLocation);
  }

  return (
    <form
      action={createGosomJobAction}
      className="overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs"
    >
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600">
          <span className="size-2 rounded-full bg-blue-600"></span>
          Konfigurasi Scraping Gosom API
        </div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Buat Job Scraping Baru
        </h2>
        <p className="text-xs text-slate-500">
          Tentukan nama job, kata kunci bisnis, target koordinat lokasi, dan parameter pencarian.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-12">
        <label className="lg:col-span-4">
          <span className="text-xs font-semibold text-slate-700">Nama Job Scraping</span>
          <input
            name="name"
            required
            placeholder="Contoh: Bengkel Mobil Jakarta Selatan"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <label className="lg:col-span-5">
          <span className="text-xs font-semibold text-slate-700">Keyword (Pisahkan Koma)</span>
          <input
            name="keywords"
            required
            placeholder="bengkel mobil, variasi ban, cuci mobil"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <label className="lg:col-span-3">
          <span className="text-xs font-semibold text-slate-700">Bahasa</span>
          <input
            name="lang"
            defaultValue="id"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <div className="lg:col-span-4">
          <label htmlFor="citySearch" className="text-xs font-semibold text-slate-700">
            Cari Kota Preset
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="citySearch"
              list="city-options"
              value={citySearch}
              onChange={(event) => handleCitySearchChange(event.target.value)}
              placeholder="Ketik nama kota, mis. Jakarta Selatan"
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setCustomLocation(true);
                setCitySearch("Custom titik koordinat");
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Custom
            </button>
          </div>
          <datalist id="city-options">
            {cityOptions.map((city) => (
              <option key={city.label} value={city.label} />
            ))}
          </datalist>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {customLocation
              ? "Isi koordinat manual untuk lokasi yang tidak ada di preset."
              : `Preset aktif: ${selectedLocation.label}`}
          </p>
        </div>

        <label className="lg:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Latitude</span>
          <input
            name="lat"
            required
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            readOnly={!customLocation}
            className={`mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              !customLocation ? "bg-slate-50 text-slate-500" : "bg-white"
            }`}
          />
        </label>

        <label className="lg:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Longitude</span>
          <input
            name="lon"
            required
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            readOnly={!customLocation}
            className={`mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              !customLocation ? "bg-slate-50 text-slate-500" : "bg-white"
            }`}
          />
        </label>

        <label className="lg:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Radius (Meter)</span>
          <input
            name="radius"
            type="number"
            min="100"
            max="100000"
            defaultValue="10000"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <label className="lg:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Kedalaman (Depth)</span>
          <input
            name="depth"
            type="number"
            min="1"
            max="50"
            defaultValue="10"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <label className="lg:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Zoom Map</span>
          <input
            name="zoom"
            type="number"
            min="1"
            max="21"
            defaultValue="15"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <label className="lg:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Durasi Max (Menit)</span>
          <input
            name="maxTimeMinutes"
            type="number"
            min="1"
            max="180"
            defaultValue="3"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-5 text-xs text-slate-700 font-medium">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              name="fastMode"
              type="checkbox"
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Fast mode (scraping cepat)</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              name="email"
              type="checkbox"
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Ambil alamat email</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              name="extraReviews"
              type="checkbox"
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Extra ulasan pengunjung</span>
          </label>
        </div>

        <PendingSubmitButton
          label="Kirim Job Scraping"
          pendingLabel="Membuat job..."
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-wait disabled:bg-blue-500"
        />
      </div>
    </form>
  );
}

function findCityOption(value: string): CityOption | undefined {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return undefined;
  }

  return cityOptions.find(
    (city) => city.label.toLowerCase() === normalizedValue,
  );
}
