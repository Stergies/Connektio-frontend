// Το πρότυπο tel: URI υποστηρίζεται από softphone/IP telephony clients (π.χ. Cisco Jabber,
// Cisco Webex Calling) που μπορούν να οριστούν ως προεπιλεγμένος χειριστής "tel:" συνδέσμων
// στα Windows/macOS - ακριβώς όπως το mailto: για email. Η εφαρμογή δεν χρειάζεται να ξέρει
// τίποτα για το συγκεκριμένο τηλεφωνικό σύστημα· απλά ανοίγει τον tel: σύνδεσμο και το
// λειτουργικό αναλαμβάνει να τον περάσει στο εγκατεστημένο IP-phone client.

export function openDialNumber(phone) {
  const raw = (phone || "").toString().trim();
  if (!raw) return;
  // Κρατάμε μόνο ψηφία, κενά, +, -, (), ώστε να μείνει ένας καθαρός, έγκυρος tel: σύνδεσμος
  const cleaned = raw.replace(/[^\d+\-() ]/g, "").trim();
  if (!cleaned) return;
  window.location.href = `tel:${cleaned}`;
}
