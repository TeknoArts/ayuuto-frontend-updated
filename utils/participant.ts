/**
 * Format participant name for display
 * If the name is an email address, returns only the part before "@"
 * Otherwise returns the name as-is
 */
export function formatParticipantName(name: string | null | undefined): string {
  if (!name) return '';
  
  // If name contains "@", it's likely an email - extract the part before "@"
  if (name.includes('@')) {
    const emailParts = name.split('@');
    return emailParts[0] || name; // Return part before "@" or original if empty
  }
  
  return name;
}
