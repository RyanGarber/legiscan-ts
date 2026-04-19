import { type Needle } from "./enums.js";
/**
 * Converts a PHP object into a JS array using {@link numericalEntries}
 * @param object PHP-style object to convert
 */
export declare function numericalToArray(object: Record<string, any>): any[];
/**
 * Class to instantiate a client for the Legiscan API
 */
export declare class LegiscanClient {
    key: string | undefined;
    /**
     * @param key the key for the API, defaults to your $LEGISCAN_API_KEY env variable
     */
    constructor(key?: string | undefined);
    /**
     * Make an API request, adding the key automatically
     * @param op The API endpoint to hit (e.g., getSearchRaw)
     * @param params Query parameters to add to the request URL
     */
    request(op: string, params?: Record<string, unknown>): Promise<any>;
    /**
     * Get a list of sessions for a state
     * @cli getSessionList
     * @param [state] The US state, or all states if omitted
     */
    getSessionList({ state }: {
        state?: Needle;
    }): Promise<any>;
    /**
     * Get a list of all bills for a given session or state
     * @cli getMasterList
     * @param [state] US State, will return the current session
     * @param [session] the ID retrieved from getSessionList()
     */
    getMasterList({ state, session, }: {
        state?: Needle;
        session?: number;
    }): Promise<any[]>;
    /**
     * Get the full text of a bill
     * @cli getBillText
     * @param id bill ID to request
     */
    getBillText({ id }: {
        id: number;
    }): Promise<any>;
    /**
     * Get the details for a bill (such as status or history)
     * @cli getBill
     * @param id bill ID to request
     */
    getBill({ id }: {
        id: number;
    }): Promise<any>;
    /**
     * Get the text of an amendment
     * @cli getAmendment
     * @param id amendment ID number (probably from getBill)
     */
    getAmendment({ id }: {
        id: number;
    }): Promise<any>;
    /**
     * Get the text of a supplement (such as a fiscal note or analysis)
     * @cli getSupplement
     * @param id supplement ID number (probably from getBill)
     */
    getSupplement({ id }: {
        id: number;
    }): Promise<any>;
    /**
     * Get the details of a roll call vote
     * @cli getRollCall
     * @param id vote ID number
     */
    getRollCall({ id }: {
        id: number;
    }): Promise<any>;
    /**
     * Get details on a person by ID
     * @cli getPerson
     * @param id The Legiscan person ID
     */
    getPerson({ id }: {
        id: number;
    }): Promise<any>;
    /**
     * Get all active people in a given legislative session
     * @cli getSessionPeople
     * @param id The Legiscan session ID
     */
    getSessionPeople({ id }: {
        id: number;
    }): Promise<any>;
    /**
     * Get a list of bills sponsored by a specific person
     * @cli getSponsoredList
     * @param id Legiscan person ID for the sponsor
     */
    getSponsoredList({ id }: {
        id: number;
    }): Promise<any>;
    /**
     * Get the results of a search as a complete array containing all response pages
     * @cli getSearch
     * @param query Full text query
     * @param [state] US state for this search
     * @param [year] Year where 1=all, 2=current, 3=recent, 4=prior, >1900=exact
     */
    getSearch({ query, state, year, }: {
        query: string;
        state?: Needle;
        year?: number;
    }): Promise<any[]>;
    /**
     * Get the results of a search one at a time, as an async iterator
     * @param query
     * @param state US state for this search
     * @param year Year where 1=all, 2=current, 3=recent, 4=prior, >1900=exact
     */
    getSearchAsync({ query, state, year, }: {
        query: string;
        state?: Needle;
        year?: number;
    }): AsyncGenerator<any, void, unknown>;
}
//# sourceMappingURL=client.d.ts.map