<?php 

date_default_timezone_set("Europe/Stockholm");

// Include basic application services!
include_once "../Shared/sessions.php";
include_once "../Shared/basic.php";

// Connect to database and start session
pdoConnect();
session_start();

$log_uuid = getOP('log_uuid');
$log_timestamp = getOP('log_timestamp');

logServiceEvent($log_uuid, EventTypes::ServiceClientStart, "resultedservice.php", $log_timestamp);
logServiceEvent($log_uuid, EventTypes::ServiceServerStart, "resultedservice.php");

if(isset($_SESSION['uid'])){
		$userid=$_SESSION['uid'];
}else{
		$userid="1";		
} 

$opt = getOP('opt');
$cid = getOP('cid');
$luid = getOP('luid');
$vers = getOP('vers');
$moment = getOP('moment');
$mark = getOP('mark');
$ukind = getOP('ukind');
$coursevers=getOP('coursevers');

$debug="NONE!";

$duggapage="";
$dugganame="";
$duggaparam="";
$duggaanswer="";
$useranswer="";
$duggastats="";

//------------------------------------------------------------------------------------------------
// Services
//------------------------------------------------------------------------------------------------
if(checklogin() && (hasAccess($_SESSION['uid'], $cid, 'w') || isSuperUser($_SESSION['uid']))) {
	if(strcmp($opt,"CHGR")==0){
		if($ukind=="U"){
			$query = $pdo->prepare("UPDATE userAnswer SET grade=:mark,creator=:cuser,marked=NOW() WHERE cid=:cid AND moment=:moment AND vers=:vers AND uid=:uid");
			$query->bindParam(':mark', $mark);
			$query->bindParam(':cuser', $userid);

			$query->bindParam(':cid', $cid);
			$query->bindParam(':moment', $moment);
			$query->bindParam(':vers', $vers);
			$query->bindParam(':uid', $luid);

			if(!$query->execute()) {
				$error=$query->errorInfo();
				$debug="Error updating entries".$error[2];
			}				
		}else if($ukind=="I"){						
			$query = $pdo->prepare("INSERT INTO userAnswer(grade,creator,cid,moment,vers,uid,marked) VALUES(:mark,:cuser,:cid,:moment,:vers,:uid,NOW());");
			$query->bindParam(':mark', $mark);
			$query->bindParam(':cuser', $userid);

			$query->bindParam(':cid', $cid);
			$query->bindParam(':moment', $moment);
			$query->bindParam(':vers', $vers);
			$query->bindParam(':uid', $luid);

			if(!$query->execute()) {
				$error=$query->errorInfo();
				$debug="Error updating entries\n".$error[2];
			}								
		}
	}

	if(strcmp($opt,"DUGGA")==0){
		$query = $pdo->prepare("SELECT userAnswer.useranswer AS aws,entryname,quizFile,qrelease,deadline,param,variant.variantanswer AS facit,timeUsed,totalTimeUsed,stepsUsed,totalStepsUsed FROM userAnswer,listentries,quiz,variant WHERE variant.vid=userAnswer.variant AND userAnswer.cid=listentries.cid AND listentries.cid=quiz.cid AND userAnswer.vers=listentries.vers AND listentries.link=quiz.id AND listentries.lid=userAnswer.moment AND uid=:luid AND userAnswer.moment=:moment AND listentries.cid=:cid AND listentries.vers=:vers;");					

		$query->bindParam(':cid', $cid);
		$query->bindParam(':vers', $vers);
		$query->bindParam(':moment', $moment);
		$query->bindParam(':luid', $luid);

		if(!$query->execute()) {
			$error=$query->errorInfo();
			$debug="Error reading entries".$error[2];
		}

		if ($row = $query->fetch(PDO::FETCH_ASSOC)) {
			$duggatitle=$row['entryname'];
			$duggafile=$row['quizFile'];
			$duggarel=$row['qrelease'];
			$duggadead=$row['deadline'];
			
			$useranswer=$row['aws'];
			$useranswer = str_replace("*##*", '"', $useranswer);
			$useranswer = str_replace("*###*", '&cap;', $useranswer);
			if(strcmp($useranswer,"") == 0){$useranswer = "UNK";} // Return UNK if we have not submitted any user answer

			$duggaparam=html_entity_decode($row['param']);

			$duggaanswer=html_entity_decode($row['facit']);

			$duggastats = array($row['timeUsed'],$row['totalTimeUsed'],$row['stepsUsed'],$row['totalStepsUsed']);

			$dugganame="templates/".$duggafile.".js";
			
			if(file_exists ( "templates/".$duggafile.".html")) {
				$duggapage=file_get_contents("templates/".$duggafile.".html");
			}
		}
	}
}

//------------------------------------------------------------------------------------------------
// Retrieve Information			
//------------------------------------------------------------------------------------------------
$entries=array();
$gentries=array();
$sentries=array();
$lentries=array();

if(strcmp($opt,"DUGGA")!==0){
	if(checklogin() && (hasAccess($_SESSION['uid'], $cid, 'w') || isSuperUser($_SESSION['uid']))) {
		// Users connected to the current course (irrespective of version)
		$query = $pdo->prepare("SELECT user_course.cid AS cid,user.uid AS uid,username,firstname,lastname,ssn FROM user,user_course WHERE user.uid=user_course.uid AND user_course.cid=:cid;");
		$query->bindParam(':cid', $cid);
		
		if(!$query->execute()) {
			$error=$query->errorInfo();
			$debug="Error updating entries".$error[2];
		}
		
		foreach($query->fetchAll(PDO::FETCH_ASSOC) as $row){
			// Create array entry for each course participant

			$entry = array(
				'cid' => (int)$row['cid'],
				'uid' => (int)$row['uid'],
				'username' => $row['username'],
				'firstname' => $row['firstname'],
				'lastname' => $row['lastname'],
				'ssn' => $row['ssn']
			);
			array_push($entries, $entry);
		}

		// All results from current course and vers?
		$query = $pdo->prepare("SELECT aid,quiz,variant,moment,grade,uid,useranswer,submitted,vers,marked,timeUsed,totalTimeUsed,stepsUsed,totalStepsUsed FROM userAnswer WHERE cid=:cid;");
		$query->bindParam(':cid', $cid);
		
		if(!$query->execute()) {
			$error=$query->errorInfo();
			$debug="Error updating entries".$error[2];
		}
		
		foreach($query->fetchAll(PDO::FETCH_ASSOC) as $row){
			if(!isset($lentries[$row['uid']])){
					$lentries[$row['uid']]=array();
			}
			
			array_push(
				$lentries[$row['uid']],
				array(
					'aid' => (int)$row['quiz'],
					'variant' => (int)$row['variant'],
					'moment' => (int)$row['moment'],
					'grade' => (int)$row['grade'],
					'uid' => (int)$row['uid'],
					'useranswer' => $row['useranswer'],
					'submitted'=> $row['submitted'],
					'vers'=> $row['vers'],
					'marked' => $row['marked'],
					'timeUsed' => $row['timeUsed'],
					'totalTimeUsed' => $row['totalTimeUsed'],
					'stepsUsed' => $row['stepsUsed'],
					'totalStepsUsed' => $row['totalStepsUsed']
				)
			);
		}

		// All dugga/moment entries from all versions of course
		$query = $pdo->prepare("SELECT lid,moment,entryname,pos,kind,link,visible,code_id,vers,gradesystem FROM listentries WHERE listentries.cid=:cid and (listentries.kind=3 or listentries.kind=4) ORDER BY pos");
		$query->bindParam(':cid', $cid);
		$result=$query->execute();
		
		if(!$query->execute()) {
			$error=$query->errorInfo();
			$debug="Error updating entries".$error[2];
		}
		
		$currentMoment=null;
		foreach($query->fetchAll(PDO::FETCH_ASSOC) as $row){
			array_push(
				$gentries,
				array(
					'entryname' => $row['entryname'],
					'lid' => (int)$row['lid'],
					'pos' => (int)$row['pos'],
					'kind' => (int)$row['kind'],
					'moment' => (int)$row['moment'],
					'link'=> $row['link'],
					'visible'=> (int)$row['visible'],
					'code_id' => $row['code_id'],
					'vers' => $row['vers'],
					'gradesystem' => (int)$row['gradesystem']					
				)
			);
		}

		// All extant versions of course
		$query = $pdo->prepare("SELECT cid,coursecode,vers FROM vers");
		$result=$query->execute();
		
		if(!$query->execute()) {
			$error=$query->errorInfo();
			$debug="Error updating entries".$error[2];
		}
		
		foreach($query->fetchAll(PDO::FETCH_ASSOC) as $row){
			array_push(
				$sentries,
				array(
					'cid' => $row['cid'],
					'coursecode' => $row['coursecode'],
					'vers' => $row['vers']
				)
			);
		}		
	}
}

$files= array();
$query = $pdo->prepare("SELECT subid,uid,vers,did,fieldnme,filename,extension,mime,updtime,kind,filepath,seq FROM submission WHERE uid=:uid AND vers=:vers AND cid=:cid ORDER BY filename,updtime desc;");
$query->bindParam(':uid', $luid);
$query->bindParam(':cid', $cid);
$query->bindParam(':vers', $coursevers);
	
$result = $query->execute();
foreach($query->fetchAll() as $row) {
		
		if($row['kind']=="3"){
				// Read file contents

				$currcvd=getcwd();

				$userdir = $lastname."_".$firstname."_".$loginname;
			  $movname=$currcvd."/submissions/".$courseid."/".$coursevers."/".$duggaid."/".$userdir."/".$row['filename'].$row['seq'].".".$row['extension'];	

			  $content=file_get_contents($movname);
		
		}else{
				$content="Egon!";						
		}
	
		$entry = array(
			'uid' => $row['uid'],
			'subid' => $row['subid'],
			'vers' => $row['vers'],
			'did' => $row['did'],
			'fieldnme' => $row['fieldnme'],
			'filename' => $row['filename'],	
			'filepath' => $row['filepath'],	
			'extension' => $row['extension'],
			'mime' => $row['mime'],
			'updtime' => $row['updtime'],
			'kind' => $row['kind'],	
			'seq' => $row['seq'],	
			'content' => $content
		);
		array_push($files, $entry);		
}		

$array = array(
	'entries' => $entries,
	'moments' => $gentries,
	'versions' => $sentries,
	'debug' => $debug,
	'results' => $lentries,
	'duggapage' => $duggapage,
	'dugganame' => $dugganame,
	'duggaparam' => $duggaparam,
	'duggaanswer' => $duggaanswer,
	'useranswer' => $useranswer,
	'duggastats' => $duggastats,
	'files' => $files
);


echo json_encode($array);
logServiceEvent($log_uuid, EventTypes::ServiceServerEnd, "resultedservice.php");
?>
