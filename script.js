// LifeLink hackathon demo. All donor records are fictional sample data.
// User-added entries are stored only in this browser via localStorage.
// This is not a live, multi-user service or an emergency medical tool.

const sampleDonors = [
  { id: "sample-1", name: "Asha Demo", bloodGroup: "O+", city: "Delhi", availability: "available", sample: true },
  { id: "sample-2", name: "Rohan Sample", bloodGroup: "B+", city: "Noida", availability: "available", sample: true },
  { id: "sample-3", name: "Mira Demo", bloodGroup: "A+", city: "Ghaziabad", availability: "not-available", sample: true },
  { id: "sample-4", name: "Kabir Sample", bloodGroup: "AB+", city: "Delhi", availability: "available", sample: true },
  { id: "sample-5", name: "Tara Demo", bloodGroup: "B-", city: "Meerut", availability: "available", sample: true },
  { id: "sample-6", name: "Dev Sample", bloodGroup: "O-", city: "Gurugram", availability: "not-available", sample: true }
];

const STORAGE_KEY = "lifelink-demo-donors-v1";
const donorList = document.querySelector("#donor-list");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const bloodFilter = document.querySelector("#blood-filter");
const availabilityFilter = document.querySelector("#availability-filter");
const resultsCount = document.querySelector("#results-count");
const donorCount = document.querySelector("#donor-count");
const donorForm = document.querySelector("#donor-form");
const formMessage = document.querySelector("#form-message");

function loadSavedDonors() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(isValidSavedDonor) : [];
  } catch (error) {
    console.warn("Could not read saved demo profiles.", error);
    return [];
  }
}

function isValidSavedDonor(donor) {
  return donor && typeof donor.id === "string" &&
    typeof donor.name === "string" && typeof donor.city === "string" &&
    ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(donor.bloodGroup) &&
    ["available", "not-available"].includes(donor.availability);
}

function saveDonors(donors) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
    return true;
  } catch (error) {
    console.error("Could not save demo profiles.", error);
    return false;
  }
}

function getAllDonors() {
  return [...sampleDonors, ...loadSavedDonors()];
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function makeDonorCard(donor) {
  const card = document.createElement("article");
  card.className = "donor-card";

  const top = document.createElement("div");
  top.className = "donor-top";
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = initials(donor.name);

  const identity = document.createElement("div");
  const name = document.createElement("p");
  name.className = "donor-name";
  name.textContent = donor.name;
  const city = document.createElement("span");
  city.className = "donor-city";
  city.textContent = donor.city;
  identity.append(name, city);

  const blood = document.createElement("span");
  blood.className = "blood-pill";
  blood.textContent = donor.bloodGroup;
  top.append(avatar, identity, blood);

  const bottom = document.createElement("div");
  bottom.className = "donor-bottom";
  const status = document.createElement("span");
  status.className = donor.availability === "available" ? "availability" : "availability offline";
  status.textContent = donor.availability === "available" ? "Available" : "Not available";
  const label = document.createElement("span");
  label.className = "profile-label";
  label.textContent = donor.sample ? "Fictional sample" : "Your local demo";
  bottom.append(status, label);

  card.append(top, bottom);

  if (!donor.sample) {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-profile";
    deleteButton.textContent = "Remove my profile";
    deleteButton.addEventListener("click", () => {
      const updated = loadSavedDonors().filter(item => item.id !== donor.id);
      if (saveDonors(updated)) renderDonors();
    });
    card.append(deleteButton);
  }
  return card;
}

function renderDonors() {
  const query = searchInput.value.trim().toLowerCase();
  const bloodGroup = bloodFilter.value;
  const availability = availabilityFilter.value;
  const filtered = getAllDonors().filter(donor => {
    const matchesText = !query || donor.name.toLowerCase().includes(query) || donor.city.toLowerCase().includes(query);
    const matchesBlood = !bloodGroup || donor.bloodGroup === bloodGroup;
    const matchesAvailability = !availability || donor.availability === availability;
    return matchesText && matchesBlood && matchesAvailability;
  });

  donorList.replaceChildren(...filtered.map(makeDonorCard));
  emptyState.hidden = filtered.length > 0;
  resultsCount.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? "profile" : "profiles"}`;
  donorCount.textContent = getAllDonors().length;
}

searchInput.addEventListener("input", renderDonors);
bloodFilter.addEventListener("change", renderDonors);
availabilityFilter.addEventListener("change", renderDonors);

document.querySelector("#clear-filters").addEventListener("click", () => {
  searchInput.value = "";
  bloodFilter.value = "";
  availabilityFilter.value = "";
  renderDonors();
});

donorForm.addEventListener("submit", event => {
  event.preventDefault();
  formMessage.textContent = "";
  formMessage.className = "form-message";

  const formData = new FormData(donorForm);
  const name = String(formData.get("name") || "").trim();
  const bloodGroup = String(formData.get("bloodGroup") || "");
  const city = String(formData.get("city") || "").trim();
  const availability = String(formData.get("availability") || "");
  const consent = formData.get("consent");

  if (!name || !city || !bloodGroup || !availability || !consent) {
    formMessage.textContent = "Please complete every required field and confirm the demo notice.";
    formMessage.classList.add("error");
    return;
  }

  const newDonor = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name, bloodGroup, city, availability, sample: false
  };
  const saved = loadSavedDonors();
  saved.push(newDonor);

  if (!saveDonors(saved)) {
    formMessage.textContent = "This browser could not save the profile. Check storage settings and try again.";
    formMessage.classList.add("error");
    return;
  }

  donorForm.reset();
  searchInput.value = "";
  bloodFilter.value = "";
  availabilityFilter.value = "";
  renderDonors();
  formMessage.textContent = "Demo profile added! It is saved only in this browser on this device.";
  formMessage.classList.add("success");
  document.querySelector("#find").scrollIntoView({ behavior: "smooth", block: "start" });
});

renderDonors();
