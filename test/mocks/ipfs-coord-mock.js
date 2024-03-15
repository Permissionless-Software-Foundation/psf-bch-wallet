/*
  Mocks for the ipfs-coord library
*/
class IPFSCoord {
    constructor() {
        this.ipfs = {
            async start() { }
        };
    }
    async isReady() {
        return true;
    }
    async start() { }
}
export default IPFSCoord;
