// Ανοίγει την προεπιλεγμένη εφαρμογή email του χρήστη (Outlook, Thunderbird, Mail, Gmail κ.λπ.)
// Δεν προσπαθούμε να μαντέψουμε ποιο πρόγραμμα χρησιμοποιεί - τα Windows/macOS αναλαμβάνουν
// αυτόματα να ανοίξουν ό,τι έχει ορίσει ο ίδιος ο χρήστης ως προεπιλογή για mailto: συνδέσμους.

// Σύνταξη email προς ΕΝΑΝ παραλήπτη (πεδίο "Προς")
export function openComposeEmail(email) {
  const trimmed = (email || "").trim();
  if (!trimmed) return;
  window.location.href = `mailto:${trimmed}`;
}

// Σύνταξη email προς ΠΟΛΛΟΥΣ παραλήπτες ταυτόχρονα (π.χ. όλη μια ομάδα) - στο BCC,
// ώστε να μη φαίνονται οι διευθύνσεις των άλλων παραληπτών μεταξύ τους
export function openComposeEmailBulk(emails) {
  const list = Array.isArray(emails) ? emails.map((e) => (e || "").trim()).filter(Boolean) : [];
  if (list.length === 0) return;
  const recipients = list.join(";");
  window.location.href = `mailto:?bcc=${encodeURIComponent(recipients)}`;
}
