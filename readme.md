# CAN Bit Pattern Generator
A web-based tool designed to help visualize and understand the low-level bit representation of CAN messages. Whether you're working on embedded systems, automotive applications, or industrial automation, this tool allows you to create custom CAN frames and instantly see their bit-level encoding, including stuffing bits and CRC calculation.
Currently, only standard frames (11-bit identifier) is supposrted.

# Abbreviations
| **Abbreviation** | **Meaning**                                                 |
| ---------------- | ----------------------------------------------------------- |
| **CAN**          | Controller Area Network                                     |
| **DLC**          | Data Length Code                                            |
| **SOF**          | Start of Frame                                              |
| **ID**           | Identifier (Arbitration Field – 11-bit or 29-bit)           |
| **RTR**          | Remote Transmission Request                                 |
| **IDE**          | Identifier Extension (distinguishes standard/extended)      |
| **r0**           | Reserved bit (must be dominant in standard CAN)             |
| **r1**           | Second reserved bit (used in CAN FD)                        |
| **D**            | Data Field                                                  |
| **CRC**          | Cyclic Redundancy Check                                     |
| **CRC Delim**    | CRC Delimiter                                               |
| **ACK**          | Acknowledge Slot (bit sent by receiving node)               |
| **ACK Delim**    | Acknowledge Delimiter                                       |
| **EOF**          | End of Frame                                                |
| **IFS**          | Inter-Frame Space                                           |
| **FD**           | Flexible Data-rate                                          |



### Disclaimer
The content on this website is provided for educational and informational purposes only and is not intended as professional or engineering advice. While efforts are made to ensure the accuracy and reliability of the information, it may not reflect the most current standards, best practices, or regulations. Users are advised to consult qualified professionals before applying any concepts, code, or techniques discussed here in real-world projects or production environments. Use of this site is at your own risk.
