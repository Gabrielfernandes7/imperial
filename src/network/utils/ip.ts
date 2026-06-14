export function subnetPrefix(ipAddress: string | null | undefined): string | undefined {
  if (!ipAddress) {
    return undefined;
  }
  const octets = ipAddress.split('.');
  if (
    octets.length !== 4 ||
    octets.some((octet) => !/^\d+$/.test(octet) || Number(octet) > 255)
  ) {
    return undefined;
  }
  return octets.slice(0, 3).join('.');
}
