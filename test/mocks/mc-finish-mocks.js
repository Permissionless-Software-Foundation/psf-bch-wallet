/*
  Mock data for the mc-finish unit tests
*/
const txObj1 = {
    hash: '92b58caf34ff70a1b68b93ee0cc4fb83ebdafd5c3b3df1531f52aa731921fb5f',
    version: 2,
    inputs: [
        {
            prevTxId: '0e04de58a3787c9c441709e7707fc79ea8cd11298decf63c132d4c5dc6d09d44',
            outputIndex: 2,
            sequenceNumber: 4294967295,
            script: '004c69522102055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e2692103112d4f9ad99e5866fdb72b0cf58683bd24e3e22734263e67b6b44aa5aab3a869210379347385945f8a8b276840e58496d1412e6a431021dbfda9782f3f50170ef4ef53ae',
            scriptString: 'OP_0 OP_PUSHDATA1 105 0x522102055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e2692103112d4f9ad99e5866fdb72b0cf58683bd24e3e22734263e67b6b44aa5aab3a869210379347385945f8a8b276840e58496d1412e6a431021dbfda9782f3f50170ef4ef53ae',
            output: {
                satoshis: 88130,
                script: 'a914d509da4acbf965449b7d2d19776487c47bb40a0a87'
            },
            threshold: 2,
            publicKeys: [
                '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269',
                '03112d4f9ad99e5866fdb72b0cf58683bd24e3e22734263e67b6b44aa5aab3a869',
                '0379347385945f8a8b276840e58496d1412e6a431021dbfda9782f3f50170ef4ef'
            ],
            signatures: [
                null,
                null,
                null
            ]
        }
    ],
    outputs: [
        {
            satoshis: 0,
            script: '6a4c587b22636964223a226261667962656963766c63777633666c7277613465676d726f79696376676865766936757a6264353664726d6f65726a6567757534696b706e6865222c227473223a313637323439353438393039377d'
        },
        {
            satoshis: 1000,
            script: '76a9143e31055173cf58d56edb075499daf29d7b488f0988ac'
        },
        {
            satoshis: 85576,
            script: 'a914d509da4acbf965449b7d2d19776487c47bb40a0a87'
        }
    ],
    nLockTime: 0,
    changeScript: 'OP_HASH160 20 0xd509da4acbf965449b7d2d19776487c47bb40a0a OP_EQUAL',
    changeIndex: 2
};
const sig1 = {
    publicKey: '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269',
    prevTxId: '0e04de58a3787c9c441709e7707fc79ea8cd11298decf63c132d4c5dc6d09d44',
    outputIndex: 2,
    inputIndex: 0,
    signature: '3045022100950d697a5c3200678ff3cc6df4bee9094a839492028645b8338f3bfbe5a8e89b0220453aefef3ea21928320eb2c6553b5ecd5a97b9e296b54eae67862b5ae2b4c005',
    sigtype: 65
};
const sig2 = {
    publicKey: '0379347385945f8a8b276840e58496d1412e6a431021dbfda9782f3f50170ef4ef',
    prevTxId: '0e04de58a3787c9c441709e7707fc79ea8cd11298decf63c132d4c5dc6d09d44',
    outputIndex: 2,
    inputIndex: 0,
    signature: '3045022100b34eb5290eb00d0a277eb027e355a04c801aa7f780d59facbff1cd806d58233c022034085836c90be32bf65b36dcb1d808a95f76650fd09961441dbafdf93f34cc14',
    sigtype: 65
};
const sigs1 = [
    {
        message: {
            publicKey: '02055962631b236ddcd2c17cd0b711f12438b93bcf01b206cadb351cc3e6e3e269',
            prevTxId: '0e04de58a3787c9c441709e7707fc79ea8cd11298decf63c132d4c5dc6d09d44',
            outputIndex: 2,
            inputIndex: 0,
            signature: '3045022100950d697a5c3200678ff3cc6df4bee9094a839492028645b8338f3bfbe5a8e89b0220453aefef3ea21928320eb2c6553b5ecd5a97b9e296b54eae67862b5ae2b4c005',
            sigtype: 65
        },
        sender: 'bitcoincash:qzwahhjldv0qsecfxlmcenzvkjv9rlv9au2hcfggl6'
    },
    {
        message: {
            publicKey: '0379347385945f8a8b276840e58496d1412e6a431021dbfda9782f3f50170ef4ef',
            prevTxId: '0e04de58a3787c9c441709e7707fc79ea8cd11298decf63c132d4c5dc6d09d44',
            outputIndex: 2,
            inputIndex: 0,
            signature: '3045022100b34eb5290eb00d0a277eb027e355a04c801aa7f780d59facbff1cd806d58233c022034085836c90be32bf65b36dcb1d808a95f76650fd09961441dbafdf93f34cc14',
            sigtype: 65
        },
        sender: 'bitcoincash:qqlrme306s9ry678m6mdefvstevrsfdtwqxq4dfx6q'
    }
];
export { txObj1 };
export { sig1 };
export { sig2 };
export { sigs1 };
export default {
    txObj1,
    sig1,
    sig2,
    sigs1
};
