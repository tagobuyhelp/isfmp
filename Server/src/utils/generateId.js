const generateTnxId = () => {
    const randomNum = Math.floor(1000000000000000 + Math.random() * 9000000000000000);
    
    return `TNX${randomNum}`
}

const generateUserId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    
    return `INL${randomNum}`
}

const generateMembershipId = (type) => {
    if (type === 'general') {
        return (Math.floor(Math.random() * 750000) + 250000).toString().padStart(6, '0');
    } else if (type === 'active') {
        return (Math.floor(Math.random() * 8999) + 1001).toString().padStart(6, '0');
    }
}





export { generateTnxId, generateUserId, generateMembershipId }



