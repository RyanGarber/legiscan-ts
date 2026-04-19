// API docs: https://legiscan.com/misc/LegiScan_API_User_Manual.pdf

import { asName, type Needle, Progress, SponsorType, State } from "./enums.js";

/**
 * Converts a PHP object with numerical keys into entries for consumption by other JS methods
 * Discards any string keys it finds along the way
 * @param object numerically-keyed object to convert to an array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* numericalEntries(object: Record<string, any>) {
  for (const k in object) {
    if (k.match(/^\d+$/)) {
      yield [Number(k), object[k]];
    }
  }
}

/**
 * Converts a PHP object into a JS array using {@link numericalEntries}
 * @param object PHP-style object to convert
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function numericalToArray(object: Record<string, any>) {
  return Array.from(numericalEntries(object), (entry) => entry[1]);
}

/**
 * Class to instantiate a client for the Legiscan API
 */
export class LegiscanClient {
  /**
   * @param key the key for the API, defaults to your $LEGISCAN_API_KEY env variable
   */
  constructor(
    public key: string | undefined = process?.env?.LEGISCAN_API_KEY,
  ) {}

  /**
   * Make an API request, adding the key automatically
   * @param op The API endpoint to hit (e.g., getSearchRaw)
   * @param params Query parameters to add to the request URL
   */
  async request(op: string, params: Record<string, unknown> = {}) {
    const url = new URL("https://api.legiscan.com/");
    url.search = new URLSearchParams({
      op: op,
      key: this.key!,
      ...params,
    }).toString();

    const response = await (await fetch(url.toString())).json();
    if (response.status == "ERROR") {
      throw new Error(
        `Legiscan API rejected request: ${response.alert?.message ?? "no reason given"}`,
      );
    }
    return response;
  }

  /*
  Other API methods to stub out:
  - getSearchRaw(query, { state?, year?, id? })
  - getDatasetList({ state?, year? })
  - getDataset(id, key)
  - getMonitorList(record?)
  - getMonitorListRaw(record?)
  - setMonitor(list, action, stance?)
  */

  /**
   * Get a list of sessions for a state
   * @cli getSessionList
   * @param [state] The US state, or all states if omitted
   */
  async getSessionList({ state }: { state?: Needle }) {
    const result = await this.request("getSessionList", {
      ...(state ? { state: asName(State, state) } : {}),
    });
    for (const session of result.sessions) {
      session.state = asName(State, session.state_id);
    }
    return result.sessions;
  }

  /**
   * Get a list of all bills for a given session or state
   * @cli getMasterList
   * @param [state] US State, will return the current session
   * @param [session] the ID retrieved from getSessionList()
   */
  async getMasterList({
    state,
    session,
  }: {
    state?: Needle;
    session?: number;
  }) {
    const result = await this.request("getMasterList", { state, id: session });
    const list = numericalToArray(result.masterlist);
    for (const item of list) {
      item.status_id = item.status;
      item.status = asName(Progress, item.status_id);
    }
    return list;
  }

  /**
   * Get the full text of a bill
   * @cli getBillText
   * @param id bill ID to request
   */
  async getBillText({ id }: { id: number }) {
    const response = await this.request("getBillText", { id });
    return response.text;
  }

  /**
   * Get the details for a bill (such as status or history)
   * @cli getBill
   * @param id bill ID to request
   */
  async getBill({ id }: { id: number }) {
    const { bill } = await this.request("getBill", { id });
    if (!bill) {
      console.log("No details for ", id);
      return {};
    }
    // adjust flags to be human-readable
    for (const stage of bill.progress) {
      stage.event_id = stage.event;
      stage.event = asName(Progress, stage.event_id);
    }
    bill.status_id = bill.status;
    bill.status = asName(Progress, bill.status_id);
    for (const person of bill.sponsors) {
      person.sponsor_type = asName(SponsorType, person.sponsor_type_id);
    }
    return bill;
  }

  /**
   * Get the text of an amendment
   * @cli getAmendment
   * @param id amendment ID number (probably from getBill)
   */
  async getAmendment({ id }: { id: number }) {
    const { amendment } = await this.request("getAmendment", { id });
    return amendment;
  }

  /**
   * Get the text of a supplement (such as a fiscal note or analysis)
   * @cli getSupplement
   * @param id supplement ID number (probably from getBill)
   */
  async getSupplement({ id }: { id: number }) {
    const { supplement } = await this.request("getSupplement", { id });
    return supplement;
  }

  /**
   * Get the details of a roll call vote
   * @cli getRollCall
   * @param id vote ID number
   */
  async getRollCall({ id }: { id: number }) {
    const result = await this.request("getRollCall", { id });
    return result.roll_call;
  }

  /**
   * Get details on a person by ID
   * @cli getPerson
   * @param id The Legiscan person ID
   */
  async getPerson({ id }: { id: number }) {
    const { person } = await this.request("getPerson", { id });
    person.state = asName(State, person.state_id);
    return person;
  }

  /**
   * Get all active people in a given legislative session
   * @cli getSessionPeople
   * @param id The Legiscan session ID
   */
  async getSessionPeople({ id }: { id: number }) {
    const response = await this.request("getSessionPeople", { id });
    const people = response.sessionpeople.people;
    for (const person of people) {
      person.state = asName(State, person.state_id);
    }
    return people;
  }

  /**
   * Get a list of bills sponsored by a specific person
   * @cli getSponsoredList
   * @param id Legiscan person ID for the sponsor
   */
  async getSponsoredList({ id }: { id: number }) {
    const response = await this.request("getSponsoredList", { id });
    const { sessions, bills } = response.sponsoredbills;
    const sessionNames = Object.fromEntries(
      sessions.map((s: { session_id: number; session_name: string }) => [
        s.session_id,
        s.session_name,
      ]),
    );
    for (const bill of bills) {
      bill.session = sessionNames[bill.session_id];
    }
    return bills;
  }

  /**
   * Get the results of a search as a complete array containing all response pages
   * @cli getSearch
   * @param query Full text query
   * @param [state] US state for this search
   * @param [year] Year where 1=all, 2=current, 3=recent, 4=prior, >1900=exact
   */
  async getSearch({
    query,
    state,
    year,
  }: {
    query: string;
    state?: Needle;
    year?: number;
  }) {
    const all = [];
    for await (const result of this.getSearchAsync({ query, state, year })) {
      all.push(result);
    }
    return all;
  }

  /**
   * Get the results of a search one at a time, as an async iterator
   * @param query
   * @param state US state for this search
   * @param year Year where 1=all, 2=current, 3=recent, 4=prior, >1900=exact
   */
  async *getSearchAsync({
    query,
    state,
    year,
  }: {
    query: string;
    state?: Needle;
    year?: number;
  }) {
    let page = 1;

    while (true) {
      const response = await this.request("getSearch", {
        query,
        page,
        ...(state ? { state: asName(State, state) } : {}),
        ...(year ? { year: year.toString() } : {}),
      });
      const { summary } = response.searchresult;
      const items = numericalToArray(response.searchresult);

      yield* items;

      page++;

      if (summary.page_total < page) return;
    }
  }
}
