const text = (label, extra = {}) => ({
  type: "text",
  label,
  required: true,
  max: 240,
  ...extra,
});
const area = (label, extra = {}) =>
  text(label, { type: "textarea", max: 4000, ...extra });
const url = (label, extra = {}) =>
  text(label, { type: "url", max: 2000, ...extra });
const image = (label) => text(label, { type: "image", max: 500 });
const imageOptions = {
  fits: ["contain", "cover"],
  ratios: ["auto", "1/1", "4/3", "16/9", "4/5"],
};
const lines = (label, extra = {}) => ({
  type: "lines",
  label,
  required: true,
  min: 1,
  max: 20,
  ...extra,
});
const id = text("ID", { hidden: true, max: 64 });
const pair = { label: text("Label"), value: area("Isi") };
export const schema = {
  profile: {
    label: "Profil & tautan",
    description: "Identitas, kontak, dan informasi dasar portofolio.",
    fields: {
      name: text("Nama lengkap"),
      brand: text("Nama di navigasi", { max: 30 }),
      pageTitle: text("Judul tab browser"),
      description: area("Deskripsi untuk mesin pencari"),
      location: text("Lokasi"),
      timezone: text("Zona waktu", { hint: "Contoh: Asia/Jakarta" }),
      email: text("Email", { type: "email" }),
      github: url("GitHub"),
      linkedin: url("LinkedIn", { required: false }),
      instagram: url("Instagram", { required: false }),
      cv: url("Tautan CV"),
      footer: text("Catatan footer"),
    },
  },
  hero: {
    label: "Halaman pembuka",
    description: "Kalimat pertama yang menyambut pengunjung.",
    fields: {
      eyebrow: text("Kalimat kecil di atas judul"),
      line1: text("Judul baris pertama", { max: 70 }),
      line2: text("Judul baris kedua", { max: 50 }),
      accent: text("Teks miring pada judul", { max: 50 }),
      intro: area("Perkenalan singkat"),
      status: text("Status pekerjaan"),
      specialty: text("Bidang keahlian"),
      stamp: area("Catatan di samping simbol", { max: 160 }),
    },
  },
  about: {
    label: "Tentang & keahlian",
    description:
      "Cerita singkat, foto, pendidikan, dan alat yang kamu gunakan.",
    fields: {
      heading: text("Judul baris pertama"),
      line2: text("Judul baris kedua"),
      accent: text("Teks miring"),
      portrait: image("Foto profil"),
      caption: text("Keterangan foto"),
      mark: text("Inisial pada foto", { max: 8 }),
      paragraphs: lines("Paragraf tentang kamu", {
        hint: "Pisahkan setiap paragraf dengan baris baru.",
        itemMax: 4000,
      }),
      facts: {
        type: "list",
        label: "Informasi ringkas",
        min: 1,
        max: 6,
        fields: pair,
      },
      skills: {
        type: "list",
        label: "Kelompok keahlian",
        min: 1,
        max: 6,
        fields: pair,
      },
    },
  },
  projects: {
    label: "Proyek",
    description:
      "Proyek paling atas menjadi karya utama. Jumlah di navigasi diperbarui otomatis.",
    type: "list",
    min: 0,
    max: 60,
    fields: {
      id,
      title: text("Judul kartu"),
      name: text("Nama proyek"),
      category: text("Kategori"),
      stack: text("Teknologi", {
        hint: "Contoh: React · TypeScript · PostgreSQL",
      }),
      description: area("Deskripsi proyek"),
      color: {
        type: "select",
        label: "Warna latar",
        options: {
          sand: "Pasir",
          sage: "Hijau lembut",
          rose: "Merah muda",
          blue: "Biru abu-abu",
        },
        required: true,
      },
      images: {
        type: "images",
        label: "Galeri gambar",
        required: true,
        min: 1,
        max: 12,
        hint: "Gambar pertama dipakai sebagai sampul. Gunakan panah untuk mengubah urutannya.",
      },
      video: text("Video perkenalan", {
        type: "video",
        required: false,
        max: 2000,
        hint: "Opsional. Isi URL HTTPS video MP4/WebM, atau path assets/videos/nama-file.mp4. Jika diisi, video menggantikan galeri saat proyek dibuka.",
      }),
      url: url("Tautan proyek atau repositori", { required: false }),
      linkLabel: text("Teks tautan", { required: false }),
    },
  },
  experience: {
    label: "Pengalaman",
    description: "Posisi, perusahaan, logo, dan hal-hal yang kamu kerjakan.",
    type: "list",
    min: 0,
    max: 50,
    fields: {
      id,
      role: text("Posisi"),
      company: text("Perusahaan / organisasi"),
      period: text("Periode", { hint: "Contoh: May 2026 – Present" }),
      logo: image("Logo perusahaan"),
      bullets: lines("Tanggung jawab / pencapaian", {
        hint: "Satu poin per baris.",
        itemMax: 3000,
      }),
    },
  },
  certificates: {
    label: "Sertifikat",
    description: "Sertifikat dan kursus yang ingin ditampilkan.",
    type: "list",
    min: 0,
    max: 40,
    fields: {
      id,
      title: text("Nama sertifikat"),
      organization: text("Penerbit"),
      period: text("Tahun / periode"),
      description: area("Deskripsi"),
      image: image("Gambar sertifikat"),
      url: url("Tautan sertifikat", { required: false }),
    },
  },
  sections: {
    label: "Judul bagian",
    description:
      "Sesuaikan judul karya, pengalaman, dan ajakan untuk menghubungi kamu.",
    fields: {
      workHeading: text("Judul bagian proyek"),
      workAccent: text("Teks miring bagian proyek"),
      workIntro: area("Pengantar proyek"),
      experienceHeading: text("Judul pengalaman"),
      experienceAccent: text("Teks miring pengalaman"),
      experienceIntro: area("Pengantar pengalaman"),
      contactIntro: area("Pengantar kontak"),
      contactHeading: text("Judul kontak"),
      contactAccent: text("Teks miring kontak"),
    },
  },
};

export function emptyRecord(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [
      key,
      key === "id"
        ? `item-${globalThis.crypto.randomUUID()}`
        : field.type === "list"
          ? []
          : ["lines", "images"].includes(field.type)
            ? []
            : field.type === "select"
              ? Object.keys(field.options)[0]
              : "",
    ]),
  );
}

export function validateContent(input) {
  const fail = (label, message) => {
    throw new Error(`${label}: ${message}`);
  };
  function fields(value, definitions, label) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      fail(label, "format tidak valid.");
    return Object.fromEntries(
      Object.entries(definitions).map(([key, field]) => [
        key,
        validate(value[key], field, `${label} / ${field.label}`),
      ]),
    );
  }
  function validate(value, field, label) {
    if (field.type === "object") return fields(value, field.fields, label);
    if (["list", "lines", "images"].includes(field.type)) {
      if (
        !Array.isArray(value) ||
        value.length < field.min ||
        value.length > field.max
      )
        fail(label, `isi ${field.min}–${field.max} item.`);
      if (field.type === "list") {
        const result = value.map((item, i) =>
          fields(item, field.fields, `${label} ${i + 1}`),
        );
        if (
          field.fields.id &&
          new Set(result.map((item) => item.id)).size !== result.length
        )
          fail(label, "ID item harus berbeda.");
        return result;
      }
      return value.map((item) =>
        validate(
          item,
          field.type === "images"
            ? image(label)
            : text(label, { max: field.itemMax || 2000 }),
          label,
        ),
      );
    }
    if (field.type === "image" && value && typeof value === "object" && !Array.isArray(value)) {
      const result = {
        src: validate(value.src, image(label), label),
        fit: value.fit ?? "contain",
        ratio: value.ratio ?? "auto",
        x: Number(value.x ?? 50),
        y: Number(value.y ?? 50),
        zoom: Number(value.zoom ?? 100),
      };
      if (!imageOptions.fits.includes(result.fit)) fail(label, "mode tampilan tidak valid.");
      if (!imageOptions.ratios.includes(result.ratio)) fail(label, "rasio gambar tidak valid.");
      if (![result.x, result.y].every((number) => Number.isFinite(number) && number >= 0 && number <= 100))
        fail(label, "posisi gambar harus antara 0 dan 100.");
      if (!Number.isFinite(result.zoom) || result.zoom < 100 || result.zoom > 200)
        fail(label, "zoom gambar harus antara 100 dan 200.");
      return result;
    }
    if (value === undefined && !field.required) value = "";
    if (typeof value !== "string") fail(label, "harus berupa teks.");
    value = value.trim();
    if (field.required && !value) fail(label, "wajib diisi.");
    if (value.length > (field.max || 240))
      fail(label, `maksimal ${field.max || 240} karakter.`);
    if (field.hidden && !/^[a-z0-9-]{1,64}$/.test(value))
      fail(label, "ID tidak valid.");
    if (field.type === "select" && !Object.hasOwn(field.options, value))
      fail(label, "pilihan tidak valid.");
    if (value && field.type === "url") {
      try {
        if (!["https:", "http:"].includes(new URL(value).protocol))
          throw new Error();
      } catch {
        fail(label, "gunakan URL lengkap dengan https:// atau http://.");
      }
    }
    if (value && field.type === "video") {
      const local = /^assets\/videos\/[a-zA-Z0-9_./-]+\.(mp4|webm)$/i.test(value) && !value.split("/").includes("..");
      let remote = false;
      try {
        const parsed = new URL(value);
        remote = parsed.protocol === "https:" && /\.(mp4|webm)$/i.test(parsed.pathname);
      } catch { /* Local paths are checked above. */ }
      if (!local && !remote) fail(label, "gunakan URL HTTPS atau path assets/videos/ yang berakhir .mp4 atau .webm.");
    }
    if (
      field.type === "email" &&
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)
    )
      fail(label, "alamat email tidak valid.");
    if (
      field.type === "image" &&
      (!value.startsWith("assets/images/") ||
        value.split("/").includes("..") ||
        /[\\?#\x00-\x1f]/.test(value) ||
        !/\.(png|jpe?g|webp|gif|svg)$/i.test(value))
    )
      fail(label, "pilih gambar dari pustaka media.");
    return value;
  }
  const result = fields(
    input,
    Object.fromEntries(
      Object.entries(schema).map(([key, section]) => [
        key,
        { ...section, type: section.type || "object" },
      ]),
    ),
    "Konten",
  );
  try {
    new Intl.DateTimeFormat("en", { timeZone: result.profile.timezone });
  } catch {
    fail("Zona waktu", "gunakan nama seperti Asia/Jakarta.");
  }
  return result;
}
