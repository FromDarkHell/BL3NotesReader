from lxml import etree, html, cssselect
from lxml.etree import tostring
import urllib.parse
import html2text
import requests
import json
import re

class newsPost:

	def __init__(self, url, bMarkdown=True):
		print("Reading news post: " + url)
		self.url = url
		self.bMarkdown = bMarkdown
		self.postInformation = ""
		self.readDataFromPost()

	def readDataFromPost(self):
		htmlTree = html.fromstring(requests.get(url=self.url).text)
		bodyText = htmlTree.cssselect('div.wysiwyg-content:nth-child(3)')[0]
		# Unquote our html output for ease, fix up redirect urls
		bodyOutput = urllib.parse.unquote(self.stringifyChildren(bodyText)).replace("locale-redirect.html?url=","en-US")

		if self.bMarkdown:
			bodyOutput = html2text.html2text(bodyOutput)
			for match in re.findall(r"]\(.+?\)", bodyOutput, re.DOTALL):
				bodyOutput = bodyOutput.replace(match, match.replace('\n',''))

		self.postInformation = bodyOutput

		# Read out the name of our post for future reference.
		self.postName = self.url.split("/")[-1]

	def stringifyChildren(self, node):
		return (node.text if node.text is not None else '') + ''.join((etree.tostring(child, encoding='unicode') for child in node))

class newsManager:

	def __init__(self, bArchived=True, bOutput=True):
		self.baseNewsPath = 'https://borderlands.com/en-US/news'
		self.baseNewsArchive = 'https://borderlands.com/en-US/news-archive/'
		self.newsPosts = []

		self.requestNews(bArchived)

		if(bOutput):
			self.writeNewsToDrive()

	def requestNews(self, bArchived):
		self.requestBaseNews()
		if bArchived:
			self.requestArchivedNews()

	def requestBaseNews(self):
		print("Reading base news...")
		htmlTree = html.fromstring(requests.get(url=self.baseNewsPath).text)

		# This is a stupidly convoluted way of sanitizing our JSON 	
		stringItems = ((str(htmlTree.cssselect('.-mt-md')[0].get('ng-init')))[12:-2] + "]").replace('url:','"url":').replace('title:','"title":').replace('category:','"category":').replace('thumb:','"thumb":').replace("'","\"").replace(',\n		}','\n		}')
		
		newsItems = json.loads(stringItems)
		for newsItem in newsItems:
			lowerTitle = newsItem['title'].lower()
			if ("hotfixes" in lowerTitle or "patch" in lowerTitle or "hot-fixes" in lowerTitle) and "borderlands 3" in lowerTitle:
				# The URLs gathered from this end with /, strip them out so we can read more info from 'em
				newRequestUrl = 'https://borderlands.com' + newsItem['url'][:-1].replace("en-us","en-US")
				self.newsPosts += [newsPost(newRequestUrl)]

	def requestArchivedNews(self):
		print("Reading archives...")
		bArchivedNews = True
		nextArchiveLink = self.baseNewsArchive
		readArchives = []
		while bArchivedNews:
			htmlTree = html.fromstring(requests.get(url=nextArchiveLink).text)
			readArchives += [nextArchiveLink]
			bSetArchive = False
			for a in htmlTree.cssselect('a'):
				if a.get('href') == None: continue
				lowerHref = a.get('href').lower().replace("en-us","en-US")
				if ("hotfixes" in lowerHref or "patch" in lowerHref or "hot-fixes" in lowerHref) and "borderlands-3" in lowerHref:
					newRequestUrl = 'https://borderlands.com' + lowerHref[:-1] 
					self.newsPosts += [newsPost(newRequestUrl)]
				if "news-archive" in lowerHref:
					nextArchiveLink = 'https://borderlands.com' + lowerHref
					if nextArchiveLink in readArchives: continue
					bSetArchive = True
					break

			if not bSetArchive:
				break
			print("\nReading new archive: " + nextArchiveLink)
		
		print("Done reading archives...")

	def writeNewsToDrive(self):
		print("Writing news to disk...")
		for newsPost in self.newsPosts:
			print("Writing post \"" + newsPost.postName + "\"")
			with open("..\\output\\" + newsPost.postName + ".md", 'w') as fileToWrite:
				fileToWrite.write(newsPost.postInformation)			


manager = newsManager()
