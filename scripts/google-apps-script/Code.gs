var INVITATION_HEADERS = ['Invitation Token', 'Primary Guest Name', 'Email', 'Invited Guest Names', 'Max Guests', 'Active', 'Created At', 'Revoked At'];
var RESPONSE_HEADERS = ['Invitation Token', 'RSVP ID', 'Submitted At', 'Updated At', 'Attending', 'Guest Count', 'Guest Names', 'Dietary Requirements', 'Song Request', 'Message'];

function doGet() {
  var parentOrigin = PropertiesService.getScriptProperties().getProperty('ALLOWED_PARENT_ORIGIN');
  if (!parentOrigin) return HtmlService.createHtmlOutput('RSVP service is not configured.');
  return HtmlService.createTemplateFromFile('Bridge').evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

function rsvpBridgeGetInvitation(token) {
  var invitation = findInvitation_(token);
  if (!invitation) return { status: 'not-found' };
  if (!invitation.active) return { status: 'revoked' };
  return { status: 'active', invitation: {
    primaryGuestName: invitation.primaryGuestName,
    invitedGuestNames: invitation.invitedGuestNames,
    maxGuests: invitation.maxGuests
  } };
}

function rsvpBridgeGetRsvp(token) {
  var invitation = findInvitation_(token);
  if (!invitation) return { status: 'not-found' };
  if (!invitation.active) return { status: 'revoked' };
  var sheet = spreadsheet_().getSheetByName('Responses');
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === token) return { status: 'active', rsvp: responseFromRow_(values[i]) };
  }
  return { status: 'active', rsvp: null };
}

function rsvpBridgeSubmitRsvp(token, rsvp) {
  if (!RsvpValidation.isToken(token)) return { status: 'not-found' };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var invitation = findInvitation_(token);
    if (!invitation) return { status: 'not-found' };
    if (!invitation.active) return { status: 'revoked' };
    if (RsvpValidation.validate(invitation, rsvp).length) throw new Error('invalid');
    var sheet = spreadsheet_().getSheetByName('Responses');
    var values = sheet.getDataRange().getValues();
    var existingRow = -1;
    for (var i = 1; i < values.length; i++) if (String(values[i][0]) === token) { existingRow = i + 1; break; }
    var now = new Date().toISOString();
    var previous = existingRow > 0 ? values[existingRow - 1] : null;
    var record = {
      invitationToken: token,
      rsvpId: previous ? String(previous[1]) : Utilities.getUuid(),
      submittedAt: previous ? String(previous[2]) : now,
      updatedAt: now,
      attending: rsvp.attending,
      guests: rsvp.attending ? rsvp.guests.map(function (guest) { return { name: String(guest.name).trim() }; }) : [],
      dietaryRequirements: rsvp.dietaryRequirements.trim(), songRequest: rsvp.songRequest.trim(), message: rsvp.message.trim()
    };
    var row = [token, record.rsvpId, record.submittedAt, now, record.attending, record.guests.length, JSON.stringify(record.guests), record.dietaryRequirements, record.songRequest, record.message];
    row = row.map(asSafeCell_);
    if (existingRow > 0) sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
    return { status: 'saved', rsvp: record };
  } catch (error) {
    throw new Error('Unable to save RSVP.');
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function spreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Not configured');
  var book = SpreadsheetApp.openById(id);
  var invitations = book.getSheetByName('Invitations');
  var responses = book.getSheetByName('Responses');
  if (!invitations || !responses) throw new Error('Missing sheets');
  assertHeaders_(invitations, INVITATION_HEADERS);
  assertHeaders_(responses, RESPONSE_HEADERS);
  return book;
}

function assertHeaders_(sheet, expected) {
  var actual = sheet.getRange(1, 1, 1, expected.length).getDisplayValues()[0];
  if (expected.some(function (name, index) { return actual[index] !== name; })) throw new Error('Invalid sheet headers');
}

function findInvitation_(token) {
  if (!RsvpValidation.isToken(token)) return null;
  var sheet = spreadsheet_().getSheetByName('Invitations');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) if (String(rows[i][0]) === token) {
    var guests;
    try { guests = JSON.parse(String(rows[i][3] || '[]')); } catch (e) { return null; }
    if (!Array.isArray(guests)) return null;
    return { invitationToken: String(rows[i][0]), primaryGuestName: String(rows[i][1]), email: String(rows[i][2]), invitedGuestNames: guests, maxGuests: Number(rows[i][4]), active: rows[i][5] === true || String(rows[i][5]).toLowerCase() === 'true' };
  }
  return null;
}

function responseFromRow_(row) {
  var guests;
  try { guests = JSON.parse(String(row[6] || '[]')); } catch (e) { guests = []; }
  return { invitationToken: String(row[0]), rsvpId: String(row[1]), submittedAt: String(row[2]), updatedAt: String(row[3]), attending: row[4] === true || String(row[4]).toLowerCase() === 'true', guests: guests, dietaryRequirements: String(row[7] || ''), songRequest: String(row[8] || ''), message: String(row[9] || '') };
}

function asSafeCell_(value) {
  var text = String(value == null ? '' : value);
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}
