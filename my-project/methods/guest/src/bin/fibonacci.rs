// Copyright 2023 RISC Zero, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#![no_main]

use std::io::Read;

use ethabi::{ethereum_types::U256, ParamType, Token};
use risc0_zkvm::guest::env;

use p256::ecdsa::Signature;
use p256::ecdsa::{VerifyingKey};
use p256::{AffinePoint, EncodedPoint, };
use p256::elliptic_curve::sec1::FromEncodedPoint;
use generic_array::GenericArray;
use p256::ecdsa::signature::hazmat::PrehashVerifier;

risc0_zkvm::guest::entry!(main);

// pub struct signature {
//     p_x: Vec<u8>,
//     p_y: Vec<u8>,
//     message: Vec<u8>,
//     sign_x: Vec<u8>,
//     sign_y: Vec<u8>,
// }

// use ethabi::*;


fn main() {
    
    let mut input_bytes = Vec::<u8>::new();
    env::stdin().read_to_end(&mut input_bytes).unwrap();    
    
    // Type array passed to `ethabi::decode_whole` should match the types encoded in
    // the application contract.
    // let input = ethabi::decode_whole(&[ParamType::Bytes], &input_bytes).unwrap();
    // let n = input[0].clone().into_uint().unwrap();
    // let n1 = input[1].clone().into_uint().unwrap();
    // let n2 = input[2].clone().into_uint().unwrap();
    // let n3 = input[3].clone().into_uint().unwrap();
    // let n4 = input[4].clone().into_uint().unwrap();
    
    let p_x: Vec<u8> = input_bytes[0..32].to_vec();
    let p_y: Vec<u8> = input_bytes[32..64].to_vec();
    let addr : Vec<u8> = input_bytes[64..84].to_vec();
    let message: Vec<u8> = input_bytes[84..116].to_vec();
    let sign_x: Vec<u8> = input_bytes[116..148].to_vec();
    let sign_y: Vec<u8> = input_bytes[148..180].to_vec();
    let value: Vec<u8> = input_bytes[180..212].to_vec();

    // let p_x: &mut [u8] = &mut [];
    // n.to_big_endian(p_x);

    // let p_y: &mut [u8] = &mut [];
    // n1.to_big_endian(p_x);

    // let message: &mut [u8] = &mut [];
    // n2.to_big_endian(p_x);

    // let sign_x: &mut [u8] = &mut [];
    // n3.to_big_endian(p_x);

    // let sign_y: &mut [u8] = &mut [];
    // n4.to_big_endian(p_x);

    let verifier = VerifyingKey::from_affine(
        AffinePoint::from_encoded_point(&EncodedPoint::from_affine_coordinates(
            GenericArray::from_slice(
                p_x.as_slice()
            ),
            GenericArray::from_slice(
                p_y.as_slice()
            ),
            false,
        ))
        .unwrap(),
    )
    .unwrap();

    let signature = Signature::from_scalars(
        GenericArray::clone_from_slice(
            sign_x.as_slice()
        ),
        GenericArray::clone_from_slice(sign_y.as_slice()),
    )
    .unwrap();
    // Verify the signature, panicking if verification fails.

    let result = verifier.verify_prehash(
        message.as_slice(),
        &signature,
    );
    assert!(result.is_ok());

    // // Commit to the journal the verifying key and messge that was signed.
    env::commit(&(input_bytes, result.is_ok()));
}
