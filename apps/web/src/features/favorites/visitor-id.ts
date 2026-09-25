const visitorIdStorageKey = 'pulse-fx:visitor-id';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getVisitorId(): string {
  try {
    const storedVisitorId = window.localStorage.getItem(
      visitorIdStorageKey,
    );

    if (
      storedVisitorId &&
      uuidPattern.test(storedVisitorId)
    ) {
      return storedVisitorId;
    }
  } catch {
    // O armazenamento pode estar indisponível no navegador.
  }

  const visitorId = window.crypto.randomUUID();

  try {
    window.localStorage.setItem(
      visitorIdStorageKey,
      visitorId,
    );
  } catch {
    // O visitante ainda pode usar a sessão sem persistência local.
  }

  return visitorId;
}