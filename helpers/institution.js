
export const getInsData = async(client,country) => {
    const institutions = await client.institution.getInstitutions({country:country});
    return institutions;
}