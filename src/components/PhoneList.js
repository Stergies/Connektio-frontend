import React from "react";
import { openDialNumber } from "../utils/tel";

// Δέχεται ένα employee ή department object (ή απευθείας πίνακα/string τηλεφώνων) και εμφανίζει
// κάθε αριθμό σαν μικρό, πατήσιμο "καρτελάκι" με 📞 - πατώντας ανοίγει κλήση (tel:) μέσω του
// προεπιλεγμένου IP-phone client (π.χ. Cisco Jabber/Webex όταν εγκατασταθεί μέσω ΣΥΖΕΥΞΙΣ ΙΙ).
const PhoneList = ({ item, phones: phonesProp, size = "normal" }) => {
  let phones = phonesProp;
  if (!phones && item) {
    if (item.internalPhones?.length) phones = item.internalPhones;
    else if (item.phones?.length) phones = item.phones;
    else if (item.phone) phones = [item.phone];
  }
  phones = Array.isArray(phones) ? phones.filter(Boolean) : phones ? [phones] : [];

  if (phones.length === 0) {
    return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
  }

  const small = size === "small";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {phones.map((phone, i) => (
        <button
          key={phone + i}
          type="button"
          onClick={() => openDialNumber(phone)}
          title={`Κλήση: ${phone}`}
          aria-label={`Κλήση στο ${phone}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            border: "1px solid var(--color-line)",
            borderRadius: 999,
            padding: small ? "1px 7px" : "3px 9px",
            fontSize: small ? 12 : 13,
            fontWeight: 600,
            background: "var(--color-paper)",
            color: "var(--color-text)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden="true">📞</span>
          {phone}
        </button>
      ))}
    </div>
  );
};

export default PhoneList;
