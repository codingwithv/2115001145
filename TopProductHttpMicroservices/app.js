const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;

const BASE_URL = "http://20.244.56.144/test";
const PAGE_SIZE = 10;
let accessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzIwNzc1MDM1LCJpYXQiOjE3MjA3NzQ3MzUsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjE4NGEwODY4LThiMzAtNDc1NC1hMjA2LWRlNjMyMjE1MDgzOSIsInN1YiI6InZpdmVrLmt1bWFyNF9jczIxQGdsYS5hYy5pbiJ9LCJjb21wYW55TmFtZSI6ImdvTWFydCIsImNsaWVudElEIjoiMTg0YTA4NjgtOGIzMC00NzU0LWEyMDYtZGU2MzIyMTUwODM5IiwiY2xpZW50U2VjcmV0IjoieUZQR0FiT1ZWd2lKU3NqYiIsIm93bmVyTmFtZSI6IlZpdmVrIiwib3duZXJFbWFpbCI6InZpdmVrLmt1bWFyNF9jczIxQGdsYS5hYy5pbiIsInJvbGxObyI6IjIxMTUwMDExNDUifQ.GCShSXOXmvZ6dlgq4CQdwLJEXHZ2SgAgaZkGj5GHlGM";

async function authenticateWithServer() {
  const url = `${BASE_URL}/auth`;
  const payload = {
    companyName: "goMart",
    clientID: "184a0868-8b30-4754-a206-de6322150839",
    clientSecret: "yFPGAbOVVwiJSsjb",
    ownerName: "Vivek",
    ownerEmail: "vivek.kumar4_cs21@gla.ac.in",
    rollNo: "2115001145",
  };

  try {
    const response = await axios.post(url, payload);
    accessToken = response.data.access_token;
  } catch (error) {
    console.error("Authentication failed. No access token received.");
  }
}

async function fetchProductsFromServer(
  company,
  category,
  top,
  minPrice,
  maxPrice
) {
  const url = `${BASE_URL}/companies/${company}/categories/${category}/products`;
  const params = {
    top: top,
    minPrice: minPrice,
    maxPrice: maxPrice,
  };
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const response = await axios.get(url, { params, headers });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch products for company ${company}: ${error}`);
    return [];
  }
}

function generateProductId(product) {
  const productString = `${product.productName}-${product.price}-${product.rating}`;
  return crypto.createHash("md5").update(productString).digest("hex");
}

app.get("/categories/:categoryName/products", async (req, res) => {
  const { categoryName } = req.params;
  const top = parseInt(req.query.top || 10);
  const page = parseInt(req.query.page || 1);
  const minPrice = parseInt(req.query.minPrice || 0);
  const maxPrice = parseInt(req.query.maxPrice || Infinity);
  const sortBy = req.query.sortBy || "price";
  const sortOrder = req.query.sortOrder || "asc";

  const companies = ["AMZ", "FLP", "SNP", "MYN", "AZO"];
  let allProducts = [];

  for (const company of companies) {
    const products = await fetchProductsFromServer(
      company,
      categoryName,
      top,
      minPrice,
      maxPrice
    );
    for (const product of products) {
      product.id = generateProductId(product);
      product.company = company;
    }
    allProducts = allProducts.concat(products);
  }

  const reverseOrder = sortOrder === "desc";
  allProducts.sort((a, b) => {
    return reverseOrder ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy];
  });

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedProducts = allProducts.slice(startIndex, endIndex);

  const response = {
    products: paginatedProducts,
    total: allProducts.length,
    page: page,
    pageSize: PAGE_SIZE,
  };

  res.json(response);
});

app.get("/categories/:categoryName/products/:productId", async (req, res) => {
  const { categoryName, productId } = req.params;
  const companies = ["AMZ", "FLP", "SNP", "MYN", "AZO"];

  for (const company of companies) {
    const products = await fetchProductsFromServer(
      company,
      categoryName,
      100,
      0,
      Infinity
    );
    const product = products.find(
      (prod) => generateProductId(prod) === productId
    );
    if (product) {
      return res.json(product);
    }
  }

  return res.status(404).json({ error: "Product not found" });
});

app.listen(PORT, async () => {
  await authenticateWithServer();
  console.log(`Server is running on port ${PORT}`);
});
